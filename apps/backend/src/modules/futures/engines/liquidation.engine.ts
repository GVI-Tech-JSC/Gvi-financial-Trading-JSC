import { Injectable, Logger } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../../prisma/prisma.service";
import { Decimal }            from "@prisma/client/runtime/library";

@Injectable()
export class LiquidationEngine {
  private readonly logger = new Logger(LiquidationEngine.name);
  constructor(private prisma: PrismaService) {}

  @Cron("*/5 * * * * *")
  async checkLiquidations() {
    const positions = await this.prisma.futuresPosition.findMany({ where: { status: "OPEN" }, take: 50 });
    for (const pos of positions) {
      try {
        const mark = this.getMockPrice(pos.symbol);
        const liq  = Number(pos.liquidationPrice ?? 0);
        const shouldLiquidate = pos.side === "LONG" ? mark <= liq : mark >= liq;
        if (!shouldLiquidate) {
          await this.prisma.futuresPosition.update({ where: { id: pos.id }, data: { markPrice: new Decimal(mark), unrealizedPnl: this.calcPnl(pos, mark) } });
          continue;
        }
        await this.prisma.$transaction(async tx => {
          await tx.futuresPosition.update({ where: { id: pos.id }, data: { status: "LIQUIDATED", realizedPnl: new Decimal(-Number(pos.margin)), markPrice: new Decimal(mark), closedAt: new Date() } });
          await tx.wallet.updateMany({ where: { userId: pos.userId, type: "FUTURES", currency: "USDT" }, data: { lockedBalance: { decrement: Number(pos.margin) } } });
          await tx.transaction.create({ data: { userId: pos.userId, type: "TRADE", status: "COMPLETED", currency: "USDT", amount: new Decimal(-Number(pos.margin)), description: `Liquidation ${pos.symbol}` } });
        });
        this.logger.warn(`Liquidated position ${pos.id} for user ${pos.userId}`);
      } catch (e: any) { this.logger.error(`Liquidation error: ${e.message}`); }
    }
  }

  private calcPnl(pos: any, mark: number): Decimal {
    const diff = new Decimal(mark).minus(pos.entryPrice);
    return pos.side === "LONG" ? diff.mul(pos.size).div(pos.entryPrice) : diff.negated().mul(pos.size).div(pos.entryPrice);
  }

  private getMockPrice(symbol: string): number {
    const p: Record<string,number> = { "BTC/USDT":65000, "ETH/USDT":3500, "SOL/USDT":150, "BNB/USDT":600 };
    return (p[symbol] ?? 100) * (1 + (Math.random() - 0.5) * 0.001);
  }
}
