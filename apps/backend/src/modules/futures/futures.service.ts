/**
 * VNKR Trade — Futures Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, BadRequestException, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService }      from "../../prisma/prisma.service";
import { WalletService }      from "../wallet/wallet.service";
import { LiquidationEngine }  from "./engines/liquidation.engine";
import { FundingRateEngine }  from "./engines/funding-rate.engine";
import { OpenPositionDto, ClosePositionDto, SetLeverageDto } from "./dto/futures.dto";
import { Decimal }            from "@prisma/client/runtime/library";

@Injectable()
export class FuturesService {
  private readonly logger = new Logger(FuturesService.name);

  constructor(
    private prisma:    PrismaService,
    private wallets:   WalletService,
    private funding:   FundingRateEngine,
  ) {}

  // ── Markets ─────────────────────────────────────────────────
  async getMarkets() {
    return this.prisma.futuresMarket.findMany({ where: { status: true } });
  }

  async getMarket(symbol: string) {
    const m = await this.prisma.futuresMarket.findUnique({ where: { symbol } });
    if (!m) throw new NotFoundException(`Market ${symbol} not found`);
    return m;
  }

  async getFundingRate(symbol: string) {
    return this.funding.getCurrentRate(symbol);
  }

  // ── Account / Positions ──────────────────────────────────────
  async getAccount(userId: string) {
    const wallet    = await this.wallets.getOrCreate(userId, "FUTURES", "USDT");
    const positions = await this.prisma.futuresPosition.findMany({
      where: { userId, status: "OPEN" },
    });
    const totalUpnl = positions.reduce((s, p) => s + Number(p.unrealizedPnl ?? 0), 0);
    return {
      balance:        Number(wallet.balance),
      inOrder:        Number(wallet.inOrder),
      unrealizedPnl:  totalUpnl,
      equity:         Number(wallet.balance) + totalUpnl,
      positions:      positions.length,
    };
  }

  async getPositions(userId: string, status?: string) {
    return this.prisma.futuresPosition.findMany({
      where: { userId, ...(status ? { status: status as any } : { status: "OPEN" }) },
      orderBy: { openedAt: "desc" },
    });
  }

  async getPosition(userId: string, id: string) {
    const p = await this.prisma.futuresPosition.findFirst({ where: { id, userId } });
    if (!p) throw new NotFoundException("Position not found");
    return p;
  }

  // ── Open Position ────────────────────────────────────────────
  async openPosition(userId: string, dto: OpenPositionDto) {
    const market = await this.getMarket(dto.symbol);
    if (dto.leverage > market.maxLeverage)
      throw new BadRequestException(`Max leverage is ${market.maxLeverage}x`);

    // Calculate required margin
    const entryPrice   = dto.price ?? await this.getMockPrice(dto.symbol);
    const posValue     = dto.size * entryPrice;
    const margin       = posValue / dto.leverage;
    const fee          = posValue * Number(market.takerFee);
    const totalRequired = margin + fee;

    await this.wallets.assertBalance(userId, "FUTURES", "USDT", totalRequired);
    await this.wallets.lockFunds(userId, "FUTURES", "USDT", totalRequired);

    const liqPrice = LiquidationEngine.calcLiquidationPrice(dto.side, entryPrice, dto.leverage);

    const position = await this.prisma.futuresPosition.create({
      data: {
        userId,
        symbol:           dto.symbol,
        side:             dto.side,
        status:           "OPEN",
        leverage:         dto.leverage,
        entryPrice:       new Decimal(entryPrice),
        markPrice:        new Decimal(entryPrice),
        size:             new Decimal(dto.size),
        margin:           new Decimal(margin),
        liquidationPrice: new Decimal(liqPrice),
        unrealizedPnl:    new Decimal(0),
      },
    });

    // Deduct fee immediately
    await this.wallets.deductBalance(userId, "FUTURES", "USDT", fee);

    this.logger.log(`Position opened: ${userId} ${dto.side} ${dto.size} ${dto.symbol} @ ${entryPrice}`);
    return position;
  }

  // ── Close Position ────────────────────────────────────────────
  async closePosition(userId: string, dto: ClosePositionDto) {
    const pos = await this.getPosition(userId, dto.positionId);
    if (pos.status !== "OPEN") throw new BadRequestException("Position is not open");

    const closePrice   = await this.getMockPrice(pos.symbol);
    const side         = pos.side as "LONG" | "SHORT";
    const closeSize    = dto.size ?? Number(pos.size);
    const realizedPnl  = LiquidationEngine.calcUnrealizedPnl(
      side, Number(pos.entryPrice), closePrice, closeSize,
    );

    const isFull = closeSize >= Number(pos.size);

    await this.prisma.$transaction(async (tx) => {
      if (isFull) {
        await tx.futuresPosition.update({
          where: { id: pos.id },
          data: {
            status:      "CLOSED",
            closePrice:  new Decimal(closePrice),
            realizedPnl: new Decimal(realizedPnl),
            closedAt:    new Date(),
          },
        });
      } else {
        const newSize   = Number(pos.size) - closeSize;
        const newMargin = (Number(pos.margin) * newSize) / Number(pos.size);
        await tx.futuresPosition.update({
          where: { id: pos.id },
          data: {
            size:   new Decimal(newSize),
            margin: new Decimal(newMargin),
          },
        });
      }
      // Unlock margin + credit PnL
      const returnAmount = (Number(pos.margin) * closeSize / Number(pos.size)) + realizedPnl;
      await tx.wallet.updateMany({
        where: { userId, type: "FUTURES", currency: "USDT" },
        data: {
          balance:  { increment: Math.max(0, returnAmount) },
          inOrder:  { decrement: Number(pos.margin) * closeSize / Number(pos.size) },
        },
      });
    });

    return { closed: true, realizedPnl, closePrice };
  }

  // ── Orders (futures) ──────────────────────────────────────────
  async getOrders(userId: string) {
    return this.prisma.futuresPosition.findMany({
      where: { userId },
      orderBy: { openedAt: "desc" },
      take: 100,
    });
  }

  private async getMockPrice(symbol: string): Promise<number> {
    const prices: Record<string, number> = {
      BTCUSDT: 65000, ETHUSDT: 3500, BNBUSDT: 600,
      SOLUSDT: 150,   XRPUSDT: 0.6,  ADAUSDT: 0.45,
    };
    return prices[symbol] ?? 100;
  }
}
