/**
 * VNKR Trade — Compliance Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * NQ-05/2025/NQ-CP + NĐ-284/2025/NĐ-CP
 */
import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { Cron }          from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import { Decimal }       from "@prisma/client/runtime/library";

const KYC_DAILY_LIMITS: Record<number, number> = { 0: 0, 1: 100_000_000, 2: 1_000_000_000, 3: Infinity };
const STR_THRESHOLD = 200_000_000; // NĐ-284 Điều 9: báo cáo giao dịch đáng ngờ ≥200M VND
const LARGE_TX_VND  = 500_000_000;

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name);
  constructor(private prisma: PrismaService) {}

  async checkTransactionLimit(userId: string, amountVnd: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { kycLevel: true } });
    const limit = KYC_DAILY_LIMITS[user?.kycLevel ?? 0] ?? 0;
    if (amountVnd > limit) {
      throw new BadRequestException(`Transaction exceeds daily limit for KYC Level ${user?.kycLevel ?? 0}. Limit: ${limit.toLocaleString()} VND`);
    }
    return { allowed: true, kycLevel: user?.kycLevel, limit };
  }

  async flagTransaction(userId: string, txId: string, amountVnd: number, description: string) {
    if (amountVnd >= STR_THRESHOLD) {
      await this.prisma.complianceAlert.create({
        data: { userId, type: "STR", severity: "HIGH", description: `STR: ${description} — ${amountVnd.toLocaleString()} VND`, txId, status: "OPEN" },
      });
      this.logger.warn(`STR filed for user ${userId}, tx ${txId}, amount ${amountVnd}`);
    }
    return { flagged: amountVnd >= STR_THRESHOLD };
  }

  async getAlerts(status?: string, page = 1, limit = 20) {
    const skip  = (page - 1) * limit;
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.complianceAlert.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.complianceAlert.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async resolveAlert(alertId: string, adminId: string, resolution: string) {
    return this.prisma.complianceAlert.update({
      where: { id: alertId },
      data:  { status: "RESOLVED", resolvedBy: adminId, resolvedAt: new Date(), description: resolution },
    });
  }

  async addToBlacklist(identifier: string, type: string, reason: string, addedBy: string) {
    return this.prisma.complianceBlacklist.upsert({
      where:  { identifier },
      create: { identifier, type, reason, addedBy },
      update: { reason, addedBy },
    });
  }

  async checkBlacklist(identifier: string) {
    return this.prisma.complianceBlacklist.findFirst({ where: { identifier } });
  }

  async getBlacklist(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.complianceBlacklist.findMany({ skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.complianceBlacklist.count(),
    ]);
    return { data, total, page, limit };
  }

  async getUserRisk(userId: string) {
    const [alerts, txCount] = await Promise.all([
      this.prisma.complianceAlert.count({ where: { userId, status: "OPEN" } }),
      this.prisma.transaction.count({ where: { userId } }),
    ]);
    return { userId, openAlerts: alerts, txCount, riskScore: alerts * 10 };
  }

  @Cron("0 30 23 * * *")
  async autoFlagLargeTransactions() {
    const since = new Date(Date.now() - 86_400_000);
    const large = await this.prisma.transaction.findMany({
      where: { createdAt: { gte: since }, amount: { gt: new Decimal(LARGE_TX_VND / 25000) } },
      take: 50,
    });
    for (const tx of large) {
      const exists = await this.prisma.complianceAlert.findFirst({ where: { txId: tx.id } });
      if (!exists) {
        await this.prisma.complianceAlert.create({
          data: { userId: tx.userId, type: "LARGE_TX", severity: "MEDIUM", description: `Auto-flagged large tx: ${tx.amount} ${tx.currency}`, txId: tx.id, status: "OPEN" },
        });
      }
    }
    this.logger.log(`Auto-flagged ${large.length} large transactions`);
  }
}
