/**
 * VNKR Trade — Funding Rate Engine
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Calculates and applies funding rates every 8 hours
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../../prisma/prisma.service";
import { Decimal }            from "@prisma/client/runtime/library";

const BASE_FUNDING_RATE = 0.0001; // 0.01% per 8h

@Injectable()
export class FundingRateEngine {
  private readonly logger = new Logger(FundingRateEngine.name);

  constructor(private prisma: PrismaService) {}

  /** Calculate funding rate (simplified: clamp between -0.075% and 0.075%) */
  static calcFundingRate(markPrice: number, indexPrice: number): number {
    const premium = (markPrice - indexPrice) / indexPrice;
    const rate    = premium / 24 + BASE_FUNDING_RATE;
    return Math.max(-0.00075, Math.min(0.00075, rate));
  }

  /** Apply funding every 8 hours at 00:00, 08:00, 16:00 UTC */
  @Cron("0 0 0,8,16 * * *")
  async applyFunding() {
    this.logger.log("Applying funding rates...");
    try {
      const markets = await this.prisma.futuresMarket.findMany({ where: { status: true } });

      for (const market of markets) {
        const rate = BASE_FUNDING_RATE; // Simplified
        await this.prisma.futuresFundingRate.create({
          data: { symbol: market.symbol, rate: new Decimal(rate) },
        });

        // Apply to all open positions for this symbol
        const positions = await this.prisma.futuresPosition.findMany({
          where: { symbol: market.symbol, status: "OPEN" },
        });

        for (const pos of positions) {
          const posValue    = Number(pos.size) * Number(pos.markPrice ?? pos.entryPrice);
          const fundingPmt  = posValue * rate;
          // LONG pays funding to SHORT when rate > 0
          const debit  = pos.side === "LONG"  ? fundingPmt : -fundingPmt;

          await this.prisma.wallet.updateMany({
            where: { userId: pos.userId, type: "FUTURES", currency: "USDT" },
            data: { balance: { decrement: debit } },
          });
        }

        this.logger.log(`Funding applied [${market.symbol}] rate=${rate}`);
      }
    } catch (e: any) {
      this.logger.error(`Funding rate error: ${e.message}`);
    }
  }

  async getCurrentRate(symbol: string) {
    const rec = await this.prisma.futuresFundingRate.findFirst({
      where: { symbol },
      orderBy: { timestamp: "desc" },
    });
    return {
      symbol,
      rate:          rec ? Number(rec.rate) : BASE_FUNDING_RATE,
      nextFundingAt: this.nextFundingTime(),
    };
  }

  private nextFundingTime(): Date {
    const now   = new Date();
    const hours = [0, 8, 16];
    const next  = hours.find(h => h > now.getUTCHours()) ?? 24;
    const d     = new Date(now);
    d.setUTCHours(next % 24, 0, 0, 0);
    if (next === 24) d.setUTCDate(d.getUTCDate() + 1);
    return d;
  }
}
