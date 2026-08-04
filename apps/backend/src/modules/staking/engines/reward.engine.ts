import { Injectable, Logger } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../../prisma/prisma.service";
import { Decimal }            from "@prisma/client/runtime/library";

@Injectable()
export class RewardEngine {
  private readonly logger = new Logger(RewardEngine.name);
  constructor(private prisma: PrismaService) {}

  @Cron("0 5 0 * * *") // daily 00:05
  async distributeRewards() {
    const positions = await this.prisma.stakingPosition.findMany({
      where: { status: "ACTIVE" }, include: { pool: true },
    });
    this.logger.log(`Distributing rewards to ${positions.length} positions`);
    for (const pos of positions) {
      const dailyRate = pos.pool.apy / 100 / 365;
      const reward    = new Decimal(Number(pos.amount) * dailyRate);
      if (pos.pool.autoCompound) {
        await this.prisma.stakingPosition.update({ where: { id: pos.id }, data: { amount: { increment: reward }, accruedReward: { increment: reward } } });
      } else {
        await this.prisma.stakingPosition.update({ where: { id: pos.id }, data: { accruedReward: { increment: reward } } });
      }
    }
    this.logger.log("Daily staking rewards distributed");
  }
}
