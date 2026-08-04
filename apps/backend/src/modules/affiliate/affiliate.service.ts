/**
 * VNKR Trade — Affiliate / MLM Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Multi-level referral: track tree, distribute commissions on trades
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { Decimal }        from "@prisma/client/runtime/library";
import { CreateTierDto }  from "./dto/affiliate.dto";
import { randomBytes }    from "crypto";

const MAX_LEVELS    = 5;
const DEFAULT_RATES = [0.10, 0.05, 0.03, 0.02, 0.01]; // L1=10%, L2=5%...

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(private prisma: PrismaService) {}

  // ── Referral Code ──────────────────────────────────────────
  async getOrCreateCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { referralCode: true },
    });
    if (user?.referralCode) return user.referralCode;
    const code = randomBytes(4).toString("hex").toUpperCase();
    await this.prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
    return code;
  }

  async getAffiliateInfo(userId: string) {
    const code = await this.getOrCreateCode(userId);
    const [referrals, totalReferrals] = await Promise.all([
      this.prisma.mlmReferral.findMany({
        where:   { referrerId: userId },
        orderBy: { createdAt: "desc" },
        take:    10,
      }),
      this.prisma.mlmReferral.count({ where: { referrerId: userId } }),
    ]);
    const totalCommission = referrals.reduce(
      (s, r) => s + Number(r.commission), 0
    );
    return {
      referralCode: code,
      referralLink: `${process.env.APP_URL ?? "https://vnkr.vn"}/ref/${code}`,
      totalReferrals,
      totalCommission,
      recentReferrals: referrals,
    };
  }

  // ── Register via referral ──────────────────────────────────
  async applyReferralCode(newUserId: string, code: string) {
    const referrer = await this.prisma.user.findFirst({
      where: { referralCode: code },
    });
    if (!referrer) throw new BadRequestException("Invalid referral code");
    if (referrer.id === newUserId) throw new BadRequestException("Cannot refer yourself");

    const existing = await this.prisma.mlmReferral.findUnique({
      where: { refereeId: newUserId },
    });
    if (existing) return existing;

    await this.prisma.user.update({
      where: { id: newUserId },
      data:  { referredById: referrer.id },
    });

    return this.prisma.mlmReferral.create({
      data: {
        referrerId: referrer.id,
        refereeId:  newUserId,
        level:      1,
        commission: new Decimal(0),
        currency:   "USDT",
        status:     "ACTIVE",
      },
    });
  }

  async validateCode(code: string) {
    const user = await this.prisma.user.findFirst({
      where:  { referralCode: code },
      select: { id: true, firstName: true, referralCode: true },
    });
    return { valid: !!user, referrer: user };
  }

  // ── Referral Tree ──────────────────────────────────────────
  async getReferralTree(userId: string, depth = 3) {
    const tree: any = { userId, children: [] };

    const buildLevel = async (parentId: string, currentDepth: number) => {
      if (currentDepth >= depth) return [];
      const refs = await this.prisma.mlmReferral.findMany({
        where: { referrerId: parentId },
        include: { referrer: { select: { email: true, firstName: true } } },
      });
      return Promise.all(refs.map(async r => ({
        userId:     r.refereeId,
        level:      r.level,
        commission: Number(r.commission),
        children:   await buildLevel(r.refereeId, currentDepth + 1),
      })));
    };

    tree.children = await buildLevel(userId, 0);
    return tree;
  }

  // ── Commission tiers ───────────────────────────────────────
  async getTiers() {
    const tiers = await this.prisma.mlmCommissionTier.findMany({
      orderBy: { level: "asc" },
    });
    if (tiers.length === 0) {
      // Return default tiers
      return DEFAULT_RATES.map((r, i) => ({
        level: i + 1, percentage: r * 100, minVolume: null,
      }));
    }
    return tiers;
  }

  async createTier(dto: CreateTierDto) {
    return this.prisma.mlmCommissionTier.upsert({
      where:  { level: dto.level },
      update: { percentage: new Decimal(dto.percentage), minVolume: dto.minVolume ? new Decimal(dto.minVolume) : null },
      create: { level: dto.level, percentage: new Decimal(dto.percentage), minVolume: dto.minVolume ? new Decimal(dto.minVolume) : null },
    });
  }

  // ── Distribute commission on trade ────────────────────────
  async distributeCommission(
    traderId: string,
    tradeVolume: number,
    currency = "USDT",
  ) {
    const tiers = await this.getTiers();
    let currentUserId = traderId;

    for (let lvl = 1; lvl <= Math.min(MAX_LEVELS, tiers.length); lvl++) {
      const ref = await this.prisma.mlmReferral.findFirst({
        where: { refereeId: currentUserId },
      });
      if (!ref) break;

      const tier       = tiers.find((t: any) => t.level === lvl);
      const rate       = tier ? Number(tier.percentage) / 100 : DEFAULT_RATES[lvl - 1];
      const commission = tradeVolume * rate;

      await this.prisma.$transaction([
        this.prisma.mlmReferral.updateMany({
          where: { referrerId: ref.referrerId, refereeId: currentUserId },
          data:  { commission: { increment: commission } },
        }),
        this.prisma.wallet.updateMany({
          where: { userId: ref.referrerId, type: "SPOT", currency },
          data:  { balance: { increment: commission } },
        }),
        this.prisma.transaction.create({
          data: {
            userId:      ref.referrerId,
            type:        "REFERRAL",
            status:      "COMPLETED",
            currency,
            amount:      new Decimal(commission),
            description: `Level ${lvl} referral commission`,
          },
        }),
      ]);

      this.logger.debug(
        `Commission L${lvl}: ${commission.toFixed(6)} ${currency} → ${ref.referrerId}`
      );
      currentUserId = ref.referrerId;
    }
  }

  // ── Stats ──────────────────────────────────────────────────
  async getStats(userId: string) {
    const code = await this.getOrCreateCode(userId);
    const [direct, total, totalComm] = await Promise.all([
      this.prisma.mlmReferral.count({ where: { referrerId: userId, level: 1 } }),
      this.prisma.mlmReferral.count({ where: { referrerId: userId } }),
      this.prisma.transaction.aggregate({
        where:  { userId, type: "REFERRAL" },
        _sum:   { amount: true },
      }),
    ]);
    return {
      referralCode:     code,
      directReferrals:  direct,
      totalNetwork:     total,
      totalCommission:  Number(totalComm._sum.amount ?? 0),
    };
  }

  // ── Admin ──────────────────────────────────────────────────
  async adminGetReferrals(params: { page?: number; limit?: number }) {
    const { page = 1, limit = 30 } = params;
    const [items, total] = await Promise.all([
      this.prisma.mlmReferral.findMany({
        skip: (page-1)*limit, take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.mlmReferral.count(),
    ]);
    return { items, total, page };
  }
}
