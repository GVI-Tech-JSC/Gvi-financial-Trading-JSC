/**
 * VNKR Trade — Affiliate / MLM Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { Decimal }        from "@prisma/client/runtime/library";
import { randomBytes }    from "crypto";

const MAX_LEVELS    = 5;
const DEFAULT_RATES = [0.10, 0.05, 0.03, 0.02, 0.01];

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);
  constructor(private prisma: PrismaService) {}

  async getOrCreateCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } });
    if (user?.referralCode) return user.referralCode;
    const code = randomBytes(4).toString("hex").toUpperCase();
    await this.prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
    return code;
  }

  async getAffiliateInfo(userId: string) {
    const code = await this.getOrCreateCode(userId);
    const [referrals, totalReferrals] = await Promise.all([
      this.prisma.mlmReferral.findMany({ where: { referrerId: userId }, orderBy: { createdAt: "desc" }, take: 10 }),
      this.prisma.mlmReferral.count({ where: { referrerId: userId } }),
    ]);
    const totalCommission = referrals.reduce((s, r) => s + Number(r.totalCommission), 0);
    return {
      referralCode:    code,
      referralLink:    `${process.env.APP_URL ?? "https://vnkr.vn"}/ref/${code}`,
      totalReferrals,
      totalCommission,
      pendingCommission: 0,
      recentReferrals: referrals,
    };
  }

  async applyReferralCode(newUserId: string, code: string) {
    const referrer = await this.prisma.user.findFirst({ where: { referralCode: code } });
    if (!referrer) throw new BadRequestException("Invalid referral code");
    if (referrer.id === newUserId) throw new BadRequestException("Cannot refer yourself");
    const existing = await this.prisma.mlmReferral.findUnique({ where: { referrerId_referredId: { referrerId: referrer.id, referredId: newUserId } } });
    if (existing) return existing;
    await this.prisma.user.update({ where: { id: newUserId }, data: { referredById: referrer.id } });
    return this.prisma.mlmReferral.create({ data: { referrerId: referrer.id, referredId: newUserId, level: 1, commissionRate: DEFAULT_RATES[0] } });
  }

  async getReferralTree(userId: string, maxDepth = MAX_LEVELS): Promise<any[]> {
    const tree: any[] = [];
    const queue = [{ id: userId, level: 0 }];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id) || level >= maxDepth) continue;
      visited.add(id);
      const refs = await this.prisma.mlmReferral.findMany({
        where: { referrerId: id }, include: { referred: { select: { id: true, firstName: true, lastName: true, email: true, createdAt: true } } },
      });
      for (const r of refs) {
        tree.push({ id: r.referredId, firstName: r.referred.firstName, lastName: r.referred.lastName, email: r.referred.email, level: level + 1, joinedAt: r.referred.createdAt, commissionEarned: Number(r.totalCommission) });
        queue.push({ id: r.referredId, level: level + 1 });
      }
    }
    return tree;
  }

  async distributeCommission(traderId: string, tradeAmount: number, currency: string) {
    let current = await this.prisma.user.findUnique({ where: { id: traderId }, select: { referredById: true } });
    if (!current?.referredById) return;
    for (let level = 1; level <= MAX_LEVELS; level++) {
      const referrerId = current.referredById;
      if (!referrerId) break;
      const rate    = DEFAULT_RATES[level - 1] ?? 0;
      const commission = new Decimal(tradeAmount).mul(rate);
      await this.prisma.affiliateCommission.create({ data: { referrerId, referredId: traderId, amount: commission, currency, level, status: "PENDING" } });
      await this.prisma.mlmReferral.updateMany({ where: { referrerId, referredId: traderId }, data: { totalCommission: { increment: commission } } });
      await this.prisma.wallet.updateMany({ where: { userId: referrerId, currency }, data: { balance: { increment: commission } } });
      current = await this.prisma.user.findUnique({ where: { id: referrerId }, select: { referredById: true } });
    }
  }

  async getLeaderboard(limit = 20) {
    return this.prisma.mlmReferral.groupBy({
      by: ["referrerId"], _count: { referredId: true }, _sum: { totalCommission: true },
      orderBy: { _count: { referredId: "desc" } }, take: limit,
    });
  }
}
