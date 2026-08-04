/**
 * VNKR Trade — Staking Reward Engine
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Distributes staking rewards every 24h
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../../prisma/prisma.service";
import { Decimal }            from "@prisma/client/runtime/library";

@Injectable()
export class RewardEngine {
  private readonly logger = new Logger(RewardEngine.name);

  constructor(private prisma: PrismaService) {}

  /** Calculate daily reward for a position */
  static calcDailyReward(amount: number, apyPercent: number): number {
    return (amount * apyPercent) / 100 / 365;
  }

  /** Run every day at 00:05 UTC */
  @Cron("0 5 0 * * *")
  async distributeDaily() {
    this.logger.log("Distributing daily staking rewards...");
    try {
      const positions = await this.prisma.stakingPosition.findMany({
        where:   { status: "ACTIVE" },
        include: { pool: true },
      });

      let totalDistributed = 0;
      let count = 0;

      for (const pos of positions) {
        const daily = RewardEngine.calcDailyReward(
          Number(pos.amount),
          Number(pos.pool.apy),
        );
        if (daily <= 0) continue;

        if (pos.pool.autoCompound) {
          // Auto-compound: add reward to staked amount
          await this.prisma.stakingPosition.update({
            where: { id: pos.id },
            data: {
              amount: { increment: daily },
              earned: { increment: daily },
            },
          });
        } else {
          // Credit to wallet
          await this.prisma.$transaction([
            this.prisma.stakingPosition.update({
              where: { id: pos.id },
              data:  { earned: { increment: daily } },
            }),
            this.prisma.wallet.updateMany({
              where: { userId: pos.userId, type: "SPOT", currency: pos.pool.currency },
              data:  { balance: { increment: daily } },
            }),
            this.prisma.transaction.create({
              data: {
                userId:      pos.userId,
                type:        "STAKING",
                status:      "COMPLETED",
                currency:    pos.pool.currency,
                amount:      new Decimal(daily),
                description: `Staking reward — ${pos.pool.name}`,
                referenceId: pos.id,
              },
            }),
          ]);
        }

        totalDistributed += daily;
        count++;
      }

      this.logger.log(`Rewards distributed: ${count} positions, total=${totalDistributed.toFixed(6)}`);
    } catch (e: any) {
      this.logger.error(`Reward distribution error: ${e.message}`);
    }
  }

  /** Preview rewards for a position */
  async previewRewards(positionId: string) {
    const pos = await this.prisma.stakingPosition.findUnique({
      where:   { id: positionId },
      include: { pool: true },
    });
    if (!pos) return null;
    const daily   = RewardEngine.calcDailyReward(Number(pos.amount), Number(pos.pool.apy));
    const weekly  = daily * 7;
    const monthly = daily * 30;
    const annual  = daily * 365;
    return {
      positionId, amount: Number(pos.amount), apy: Number(pos.pool.apy),
      earned: Number(pos.earned),
      projected: { daily, weekly, monthly, annual },
    };
  }
}
