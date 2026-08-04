import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { Decimal }       from "@prisma/client/runtime/library";
import { OpenPositionDto, ClosePositionDto } from "./dto/futures.dto";

@Injectable()
export class FuturesService {
  private readonly logger = new Logger(FuturesService.name);
  constructor(private prisma: PrismaService, private wallets: WalletService) {}

  async getPositions(userId: string) {
    return this.prisma.futuresPosition.findMany({
      where: { userId }, orderBy: { createdAt: "desc" }, take: 50,
    });
  }

  async openPosition(userId: string, dto: OpenPositionDto) {
    if (dto.leverage < 1 || dto.leverage > 125) throw new BadRequestException("Leverage must be 1-125");
    await this.wallets.assertBalance(userId, "FUTURES", "USDT", dto.margin);
    const mockPrice   = this.getMockPrice(dto.symbol);
    const size        = new Decimal(dto.margin).mul(dto.leverage);
    const liqDelta    = new Decimal(dto.margin).div(size);
    const liqPrice    = dto.side === "LONG"
      ? new Decimal(mockPrice).mul(new Decimal(1).minus(liqDelta))
      : new Decimal(mockPrice).mul(new Decimal(1).plus(liqDelta));
    await this.wallets.lockFunds(userId, "FUTURES", "USDT", dto.margin);
    return this.prisma.futuresPosition.create({
      data: { userId, symbol: dto.symbol, side: dto.side as any, leverage: dto.leverage, margin: new Decimal(dto.margin), size, entryPrice: new Decimal(mockPrice), markPrice: new Decimal(mockPrice), liquidationPrice: liqPrice, status: "OPEN" },
    });
  }

  async closePosition(userId: string, positionId: string, dto?: ClosePositionDto) {
    const pos = await this.prisma.futuresPosition.findUnique({ where: { id: positionId } });
    if (!pos || pos.userId !== userId) throw new NotFoundException("Position not found");
    if (pos.status !== "OPEN") throw new BadRequestException("Position already closed");
    const closePrice = this.getMockPrice(pos.symbol);
    const priceDiff  = new Decimal(closePrice).minus(pos.entryPrice);
    const pnl        = pos.side === "LONG" ? priceDiff.mul(pos.size).div(pos.entryPrice) : priceDiff.negated().mul(pos.size).div(pos.entryPrice);
    const returnAmt  = new Decimal(pos.margin).plus(pnl);
    await this.prisma.$transaction(async tx => {
      await tx.futuresPosition.update({ where: { id: positionId }, data: { status: "CLOSED", realizedPnl: pnl, closedAt: new Date(), markPrice: new Decimal(closePrice) } });
      await tx.wallet.updateMany({ where: { userId, type: "FUTURES", currency: "USDT" }, data: { balance: { increment: Number(returnAmt) }, lockedBalance: { decrement: Number(pos.margin) } } });
      await tx.transaction.create({ data: { userId, type: "TRADE", status: "COMPLETED", currency: "USDT", amount: returnAmt, description: `Futures PnL ${pos.symbol} ${pos.side}` } });
    });
    return { closed: true, pnl: Number(pnl), returnAmount: Number(returnAmt) };
  }

  private getMockPrice(symbol: string): number {
    const p: Record<string,number> = { "BTC/USDT":65000, "ETH/USDT":3500, "SOL/USDT":150, "BNB/USDT":600 };
    return p[symbol] ?? 100;
  }
}
