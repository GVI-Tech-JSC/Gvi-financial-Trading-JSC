import { Injectable, Logger } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../../prisma/prisma.service";
import { Decimal }            from "@prisma/client/runtime/library";

@Injectable()
export class FundingRateEngine {
  private readonly logger = new Logger(FundingRateEngine.name);
  constructor(private prisma: PrismaService) {}

  @Cron("0 0 0,8,16 * * *")
  async applyFundingRates() {
    const RATE = new Decimal(0.0001); // 0.01% every 8h
    const positions = await this.prisma.futuresPosition.findMany({ where: { status: "OPEN" } });
    this.logger.log(`Applying funding to ${positions.length} positions`);
    for (const pos of positions) {
      const fee = new Decimal(pos.margin).mul(RATE);
      await this.prisma.$transaction([
        this.prisma.futuresPosition.update({ where: { id: pos.id }, data: { fundingFee: { increment: fee } } }),
        this.prisma.wallet.updateMany({ where: { userId: pos.userId, type: "FUTURES", currency: "USDT" }, data: { balance: { decrement: Number(fee) } } }),
      ]);
    }
  }
}
