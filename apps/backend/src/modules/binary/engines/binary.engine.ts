/**
 * VNKR Trade — Binary Options Engine
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Resolves binary orders at expiry, credits profit to winner
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../../prisma/prisma.service";
import { Decimal }            from "@prisma/client/runtime/library";

@Injectable()
export class BinaryEngine {
  private readonly logger = new Logger(BinaryEngine.name);

  constructor(private prisma: PrismaService) {}

  /** Run every 2 seconds — resolve expired orders */
  @Cron("*/2 * * * * *")
  async resolveExpiredOrders() {
    const now     = new Date();
    const expired = await this.prisma.binaryOrder.findMany({
      where: {
        expiresAt: { lte: now },
        result:    null,
        closedAt:  null,
      },
      take: 20,
    });
    if (expired.length === 0) return;

    for (const order of expired) {
      try {
        await this.resolveOrder(order);
      } catch (e: any) {
        this.logger.warn(`Binary resolve error [${order.id}]: ${e.message}`);
      }
    }
  }

  private async resolveOrder(order: any) {
    // Get current mark price (mock from exchange orders)
    const closePrice = await this.getClosePrice(order.symbol);
    const openPrice  = Number(order.openPrice);

    // Determine result
    const priceRose  = closePrice > openPrice;
    const isWin      =
      (order.side === "RISE" && priceRose) ||
      (order.side === "FALL" && !priceRose);

    const market = await this.prisma.binaryMarket.findUnique({
      where: { symbol: order.symbol },
    });
    const payoutRate  = market ? Number(market.payoutRate) / 100 : 0.85;
    const profit      = isWin ? Number(order.amount) * payoutRate : -Number(order.amount);
    const result      = isWin ? "WIN" : "LOSS";

    await this.prisma.$transaction(async (tx) => {
      // Update order
      await tx.binaryOrder.update({
        where: { id: order.id },
        data: {
          closePrice: new Decimal(closePrice),
          profit:     new Decimal(profit),
          result,
          closedAt:   new Date(),
        },
      });

      // Credit/debit wallet
      if (isWin) {
        await tx.wallet.updateMany({
          where: { userId: order.userId, type: "SPOT", currency: "USDT" },
          data: { balance: { increment: Number(order.amount) + profit } },
        });
      }
      // (amount already deducted at order placement)
    });

    this.logger.log(
      `Binary [${order.id}] ${result} — open:${openPrice} close:${closePrice} profit:${profit.toFixed(2)}`
    );
  }

  private async getClosePrice(symbol: string): Promise<number> {
    const order = await this.prisma.exchangeOrder.findFirst({
      where:   { symbol },
      orderBy: { createdAt: "desc" },
    });
    // Fallback mock prices
    const mocks: Record<string, number> = {
      "BTC/USDT": 65000 + Math.random() * 200 - 100,
      "ETH/USDT": 3500  + Math.random() * 20  - 10,
    };
    return order ? Number(order.price) : (mocks[symbol] ?? 100);
  }
}
