/**
 * VNKR Trade — Compliance Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 *
 * Implements:
 *  - NQ-05/2025/NQ-CP Điều 7  : Daily transaction limits
 *  - NĐ-284/2025 Điều 9       : STR (Suspicious Transaction Report) 48h deadline
 *  - NQ-05/2025/NQ-CP Điều 6  : ICO investor check (non-domestic only)
 */
import { Injectable, Logger, ForbiddenException } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../prisma/prisma.service";
import { Decimal }            from "@prisma/client/runtime/library";
import { FlagStrDto, SubmitStrDto } from "./dto/compliance.dto";

// Daily limits per KYC level (VNKR token, NQ-05 Điều 7)
const DAILY_LIMITS: Record<number, Record<string, number>> = {
  0: { DEPOSIT: 5_000_000,   WITHDRAW: 5_000_000   },  // Level 0: 5M VND equiv
  1: { DEPOSIT: 50_000_000,  WITHDRAW: 50_000_000  },  // Level 1: 50M
  2: { DEPOSIT: 500_000_000, WITHDRAW: 500_000_000 },  // Level 2: 500M
  3: { DEPOSIT: Infinity,    WITHDRAW: Infinity    },  // Level 3: unlimited
};

const STR_THRESHOLD_VND = 300_000_000; // 300M VND — báo cáo giao dịch đáng ngờ

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);

  constructor(private prisma: PrismaService) {}

  // ── Daily Limit Check (NQ-05 Điều 7) ──────────────────────
  async getDailyLimit(userId: string, type: string, currency: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { kycLevel: true },
    });
    const level  = user?.kycLevel ?? 0;
    const limits = DAILY_LIMITS[level] ?? DAILY_LIMITS[0];
    const limit  = limits[type] ?? 0;

    // Calculate used today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const usedAgg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type:      type as any,
        currency,
        status:    "COMPLETED",
        createdAt: { gte: today },
      },
      _sum: { amount: true },
    });
    const used      = Number(usedAgg._sum.amount ?? 0);
    const remaining = Math.max(0, limit === Infinity ? Infinity : limit - used);
    const resetAt   = new Date(today.getTime() + 86400000);

    return {
      kycLevel: level,
      type,
      currency,
      limit:     limit === Infinity ? null : limit,
      used,
      remaining: remaining === Infinity ? null : remaining,
      resetAt,
      legalBasis: "NQ-05/2025/NQ-CP Điều 7",
    };
  }

  async assertDailyLimit(userId: string, type: string, currency: string, amount: number) {
    const info = await this.getDailyLimit(userId, type, currency);
    if (info.remaining !== null && amount > info.remaining) {
      throw new ForbiddenException(
        `Daily ${type} limit exceeded. Remaining: ${info.remaining} ${currency}. ` +
        `Upgrade KYC to increase limit. (NQ-05/2025/NQ-CP Điều 7)`
      );
    }
  }

  // ── STR — Suspicious Transaction Report (NĐ-284 Điều 9) ────
  async flagTransaction(dto: FlagStrDto, flaggedBy: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: dto.transactionId },
    });

    // Auto-flag if amount > threshold
    const isAutoFlag = tx && Number(tx.amount) >= STR_THRESHOLD_VND;

    const report = await this.prisma.strReport.create({
      data: {
        transactionId: dto.transactionId,
        userId:        tx?.userId,
        reason:        dto.reason,
        status:        "PENDING",
        // 48h deadline per NĐ-284/2025 Điều 9
        deadlineAt:    new Date(Date.now() + 48 * 3600 * 1000),
      },
    });

    await this.prisma.complianceAlert.create({
      data: {
        userId:      tx?.userId,
        type:        "STR_FLAGGED",
        severity:    dto.severity ?? (isAutoFlag ? "HIGH" : "MEDIUM"),
        description: dto.reason,
        status:      "OPEN",
      },
    });

    this.logger.warn(
      `STR flagged: tx=${dto.transactionId} by=${flaggedBy} severity=${dto.severity}`
    );
    return report;
  }

  async getStrSummary() {
    const [pending, warning, critical, overdue] = await Promise.all([
      this.prisma.strReport.count({ where: { status: "PENDING" } }),
      this.prisma.strReport.count({
        where: {
          status:    "PENDING",
          deadlineAt:{ gt: new Date(), lte: new Date(Date.now() + 12 * 3600 * 1000) },
        },
      }),
      this.prisma.strReport.count({
        where: { status: "PENDING", deadlineAt: { lte: new Date() } },
      }),
      this.prisma.strReport.count({
        where: { status: "PENDING", deadlineAt: { lt: new Date() } },
      }),
    ]);

    const reports = await this.prisma.strReport.findMany({
      where:   { status: "PENDING" },
      orderBy: { deadlineAt: "asc" },
      take:    50,
    });

    return {
      summary: { pending, warning, critical, overdue },
      reports,
      legalBasis: "NĐ-284/2025 Điều 9 — 48h reporting deadline",
    };
  }

  async submitStrReport(dto: SubmitStrDto, submittedBy: string) {
    const report = await this.prisma.strReport.update({
      where: { id: dto.strReportId },
      data:  { status: "SUBMITTED", submittedAt: new Date() },
    });
    this.logger.log(`STR submitted: ${dto.strReportId} ref=${dto.reportRef} by=${submittedBy}`);
    return report;
  }

  async escalateStr(strReportId: string, adminId: string) {
    return this.prisma.strReport.update({
      where: { id: strReportId },
      data:  { status: "ESCALATED" },
    });
  }

  // ── ICO Investor Check (NQ-05 Điều 6) ─────────────────────
  async checkIcoEligibility(userId: string): Promise<{ eligible: boolean; reason?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { kycLevel: true, settings: true },
    });
    const settings    = user?.settings as any;
    const investorType = settings?.investorType ?? "DOMESTIC";

    // NQ-05/2025/NQ-CP Điều 6: chặn nhà đầu tư cá nhân trong nước
    if (!investorType || investorType === "DOMESTIC") {
      return {
        eligible: false,
        reason: "Domestic individual investors are not permitted to purchase ICO tokens. " +
                "(NQ-05/2025/NQ-CP Điều 6)",
      };
    }
    if (user?.kycLevel === 0) {
      return { eligible: false, reason: "KYC required for ICO participation" };
    }
    return { eligible: true };
  }

  // ── AML Monitoring ─────────────────────────────────────────
  async getTransactionMonitoring(params: {
    page?: number; minAmount?: number; flagged?: boolean;
  }) {
    const { page = 1, minAmount = 0, flagged } = params;
    const where: any = {
      ...(minAmount > 0 ? { amount: { gte: new Decimal(minAmount) } } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where, skip: (page-1)*30, take: 30,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true, kycLevel: true } } },
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total, page };
  }

  async getAlerts(status?: string) {
    return this.prisma.complianceAlert.findMany({
      where:   status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take:    100,
    });
  }

  async getBlacklist() {
    return this.prisma.blacklistEntry.findMany({ orderBy: { createdAt: "desc" } });
  }

  async addToBlacklist(type: string, value: string, reason: string) {
    return this.prisma.blacklistEntry.upsert({
      where:  { type_value: { type, value } },
      update: { reason },
      create: { type, value, reason },
    });
  }

  // ── Cron: auto-flag large transactions ────────────────────
  @Cron("0 */10 * * * *")
  async autoFlagLargeTx() {
    const large = await this.prisma.transaction.findMany({
      where: {
        amount:    { gte: new Decimal(STR_THRESHOLD_VND) },
        status:    "COMPLETED",
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    });

    for (const tx of large) {
      const existing = await this.prisma.strReport.findFirst({
        where: { transactionId: tx.id },
      });
      if (!existing) {
        await this.prisma.strReport.create({
          data: {
            transactionId: tx.id,
            userId:        tx.userId,
            reason:        `Auto-flagged: amount ${Number(tx.amount)} ${tx.currency} ≥ threshold`,
            status:        "PENDING",
            deadlineAt:    new Date(Date.now() + 48 * 3600 * 1000),
          },
        });
        this.logger.warn(`Auto-STR: tx=${tx.id} amount=${tx.amount} ${tx.currency}`);
      }
    }
  }
}
