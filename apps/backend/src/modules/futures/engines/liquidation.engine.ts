/**
 * VNKR Trade — Liquidation Engine
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Monitors open positions, triggers liquidation when margin < maintenance
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../../prisma/prisma.service";
import { Decimal }            from "@prisma/client/runtime/library";

const MAINTENANCE_MARGIN_RATE = 0.005; // 0.5%
const INSURANCE_FEE_RATE      = 0.001; // 0.1%

@Injectable()
export class LiquidationEngine {
  private readonly logger = new Logger(LiquidationEngine.name);

  constructor(private prisma: PrismaService) {}

  /** Calculate liquidation price for a position */
  static calcLiquidationPrice(
    side: "LONG" | "SHORT",
    entryPrice: number,
    leverage: number,
    maintMarginRate = MAINTENANCE_MARGIN_RATE,
  ): number {
    const mmr = maintMarginRate;
    if (side === "LONG") {
      // liqPrice = entryPrice * (1 - 1/leverage + mmr)
      return entryPrice * (1 - 1 / leverage + mmr);
    } else {
      // liqPrice = entryPrice * (1 + 1/leverage - mmr)
      return entryPrice * (1 + 1 / leverage - mmr);
    }
  }

  /** Calculate unrealized PnL */
  static calcUnrealizedPnl(
    side: "LONG" | "SHORT",
    entryPrice: number,
    markPrice: number,
    size: number,
  ): number {
    if (side === "LONG") return (markPrice - entryPrice) * size;
    return (entryPrice - markPrice) * size;
  }

  /** Calculate margin ratio */
  static calcMarginRatio(
    margin: number,
    unrealizedPnl: number,
    size: number,
    markPrice: number,
  ): number {
    const equity = margin + unrealizedPnl;
    const positionValue = size * markPrice;
    return positionValue > 0 ? equity / positionValue : 0;
  }

  /** Run every 5 seconds — check all open positions */
  @Cron("*/5 * * * * *")
  async runLiquidationCheck() {
    try {
      const positions = await this.prisma.futuresPosition.findMany({
        where: { status: "OPEN" },
      });
      if (positions.length === 0) return;

      for (const pos of positions) {
        const markPrice = await this.getMarkPrice(pos.symbol);
        if (!markPrice) continue;

        const side        = pos.side as "LONG" | "SHORT";
        const entryPrice  = Number(pos.entryPrice);
        const size        = Number(pos.size);
        const margin      = Number(pos.margin);
        const leverage    = pos.leverage;

        const liqPrice    = LiquidationEngine.calcLiquidationPrice(side, entryPrice, leverage);
        const upnl        = LiquidationEngine.calcUnrealizedPnl(side, entryPrice, markPrice, size);
        const marginRatio = LiquidationEngine.calcMarginRatio(margin, upnl, size, markPrice);

        // Update mark price and unrealized PnL
        await this.prisma.futuresPosition.update({
          where: { id: pos.id },
          data: {
            markPrice:        new Decimal(markPrice),
            unrealizedPnl:    new Decimal(upnl),
            liquidationPrice: new Decimal(liqPrice),
          },
        });

        // Trigger liquidation if margin ratio < maintenance
        const shouldLiquidate = side === "LONG"
          ? markPrice <= liqPrice
          : markPrice >= liqPrice;

        if (shouldLiquidate || marginRatio < MAINTENANCE_MARGIN_RATE) {
          await this.liquidatePosition(pos.id, markPrice, upnl);
        }
      }
    } catch (e: any) {
      this.logger.warn(`Liquidation check error: ${e.message}`);
    }
  }

  private async liquidatePosition(posId: string, markPrice: number, upnl: number) {
    const pos = await this.prisma.futuresPosition.findUnique({ where: { id: posId } });
    if (!pos || pos.status !== "OPEN") return;

    this.logger.warn(`Liquidating position ${posId} at ${markPrice}`);

    const realizedPnl = upnl;
    const insuranceFee = Math.abs(Number(pos.size) * markPrice * INSURANCE_FEE_RATE);

    await this.prisma.$transaction([
      // Mark position as liquidated
      this.prisma.futuresPosition.update({
        where: { id: posId },
        data: {
          status:      "LIQUIDATED",
          closePrice:  new Decimal(markPrice),
          realizedPnl: new Decimal(realizedPnl),
          closedAt:    new Date(),
        },
      }),
      // Record insurance fee
      this.prisma.adminProfit.create({
        data: {
          type:        "FUTURES_LIQUIDATION",
          currency:    "USDT",
          amount:      new Decimal(insuranceFee),
          description: `Liquidation ${posId}`,
        },
      }),
      // Deduct remaining from user futures wallet
      this.prisma.wallet.updateMany({
        where: { userId: pos.userId, type: "FUTURES", currency: "USDT" },
        data: { balance: { decrement: Math.max(0, Number(pos.margin) + realizedPnl) } },
      }),
    ]);

    this.logger.warn(`Position ${posId} liquidated — PnL: ${realizedPnl.toFixed(4)} USDT`);
  }

  private async getMarkPrice(symbol: string): Promise<number | null> {
    try {
      const rec = await this.prisma.futuresFundingRate.findFirst({
        where: { symbol },
        orderBy: { timestamp: "desc" },
      });
      // In production: fetch from price oracle / CCXT
      // For dev: return a mock price based on exchange_orders last price
      const order = await this.prisma.exchangeOrder.findFirst({
        where: { symbol: symbol.replace("USDT", "/USDT") },
        orderBy: { createdAt: "desc" },
      });
      return order ? Number(order.price) : null;
    } catch { return null; }
  }
}
