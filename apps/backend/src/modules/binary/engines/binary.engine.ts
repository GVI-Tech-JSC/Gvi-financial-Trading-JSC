/**
 * VNKR Trade — Binary Options Engine
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../../prisma/prisma.service";
import { Decimal }            from "@prisma/client/runtime/library";

const PAYOUT_RATE = 0.85;

@Injectable()
export class BinaryEngine {
  private readonly logger = new Logger(BinaryEngine.name);
  constructor(private prisma: PrismaService) {}

  @Cron("*/2 * * * * *")
  async resolveExpiredOrders() {
    const now     = new Date();
    const expired = await this.prisma.binaryOrder.findMany({
      where: { expiresAt: { lte: now }, status: "PENDING" },
      take:  20,
    });
    for (const order of expired) {
      try { await this.resolveOrder(order); }
      catch (e: any) { this.logger.warn(`Binary resolve error [${order.id}]: ${e.message}`); }
    }
  }

  private async resolveOrder(order: any) {
    const closePrice = await this.getClosePrice(order.symbol);
    const entryPrice = Number(order.entryPrice ?? 0);
    const priceRose  = closePrice > entryPrice;
    const isWin      = (order.direction === "RISE" && priceRose) || (order.direction === "FALL" && !priceRose);
    const payout     = isWin ? Number(order.amount) * (1 + PAYOUT_RATE) : 0;
    const result: "WIN"|"LOSS" = isWin ? "WIN" : "LOSS";

    await this.prisma.$transaction(async tx => {
      await tx.binaryOrder.update({
        where: { id: order.id },
        data:  { exitPrice: new Decimal(closePrice), payout: new Decimal(payout), result, status: isWin ? "WON" : "LOST" },
      });
      if (isWin) {
        await tx.wallet.updateMany({
          where: { userId: order.userId, type: "SPOT", currency: "USDT" },
          data:  { balance: { increment: payout } },
        });
      }
    });
    this.logger.log(`Binary [${order.id}] ${result} — entry:${entryPrice} close:${closePrice.toFixed(2)} payout:${payout.toFixed(2)}`);
  }

  private async getClosePrice(symbol: string): Promise<number> {
    const mocks: Record<string, number> = { "BTC/USDT": 65000, "ETH/USDT": 3500, "BNB/USDT": 600, "SOL/USDT": 150 };
    return (mocks[symbol] ?? 100) * (1 + (Math.random() - 0.5) * 0.002);
  }
}
