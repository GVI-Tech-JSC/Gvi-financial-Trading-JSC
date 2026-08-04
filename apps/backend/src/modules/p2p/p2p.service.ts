import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { WalletService }  from "../wallet/wallet.service";
import { Decimal }        from "@prisma/client/runtime/library";
import { CreateOfferDto, CreateTradeDto } from "./dto/p2p.dto";

@Injectable()
export class P2pService {
  private readonly logger = new Logger(P2pService.name);
  constructor(private prisma: PrismaService, private wallets: WalletService) {}

  async getOffers(type?: string, currency?: string, fiat?: string) {
    return this.prisma.p2pOffer.findMany({
      where: { status: "ACTIVE", ...(type ? { type: type as any } : {}), ...(currency ? { currency } : {}), ...(fiat ? { fiatCurrency: fiat } : {}) },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" }, take: 50,
    });
  }

  async createOffer(userId: string, dto: CreateOfferDto) {
    if (dto.type === "SELL") {
      await this.wallets.assertBalance(userId, "SPOT", dto.currency, dto.maxAmount);
      await this.wallets.lockFunds(userId, "SPOT", dto.currency, dto.maxAmount);
    }
    return this.prisma.p2pOffer.create({
      data: { userId, type: dto.type as any, currency: dto.currency, fiatCurrency: dto.fiatCurrency, price: new Decimal(dto.price), minAmount: new Decimal(dto.minAmount), maxAmount: new Decimal(dto.maxAmount), available: new Decimal(dto.maxAmount), paymentMethod: dto.paymentMethod, terms: dto.terms, escrowLocked: dto.type === "SELL" ? new Decimal(dto.maxAmount) : new Decimal(0) },
    });
  }

  async createTrade(buyerId: string, dto: CreateTradeDto) {
    const offer = await this.prisma.p2pOffer.findUnique({ where: { id: dto.offerId } });
    if (!offer || offer.status !== "ACTIVE") throw new NotFoundException("Offer not found or inactive");
    if (offer.userId === buyerId) throw new BadRequestException("Cannot trade with yourself");
    const amount    = new Decimal(dto.amount);
    const fiatAmt   = amount.mul(offer.price);
    if (amount.lt(offer.minAmount) || amount.gt(offer.available)) throw new BadRequestException("Amount out of range");
    await this.prisma.p2pOffer.update({ where: { id: dto.offerId }, data: { available: { decrement: dto.amount } } });
    return this.prisma.p2pTrade.create({ data: { offerId: dto.offerId, buyerId, sellerId: offer.userId, amount, fiatAmount: fiatAmt, status: "PENDING" } });
  }

  async confirmPayment(tradeId: string, userId: string) {
    const trade = await this.prisma.p2pTrade.findUnique({ where: { id: tradeId } });
    if (!trade || trade.buyerId !== userId) throw new NotFoundException("Trade not found");
    return this.prisma.p2pTrade.update({ where: { id: tradeId }, data: { status: "PAID", paidAt: new Date() } });
  }

  async releaseFunds(tradeId: string, userId: string) {
    const trade = await this.prisma.p2pTrade.findUnique({ where: { id: tradeId }, include: { offer: true } });
    if (!trade || trade.sellerId !== userId) throw new NotFoundException("Trade not found");
    if (trade.status !== "PAID") throw new BadRequestException("Payment not confirmed yet");
    await this.prisma.$transaction(async tx => {
      await tx.p2pTrade.update({ where: { id: tradeId }, data: { status: "COMPLETED", completedAt: new Date() } });
      await tx.wallet.updateMany({ where: { userId: trade.buyerId, type: "SPOT", currency: trade.offer.currency }, data: { balance: { increment: Number(trade.amount) } } });
      await tx.wallet.updateMany({ where: { userId, type: "SPOT", currency: trade.offer.currency }, data: { lockedBalance: { decrement: Number(trade.amount) } } });
    });
    return { completed: true };
  }

  async openDispute(tradeId: string, userId: string, reason: string) {
    const trade = await this.prisma.p2pTrade.findUnique({ where: { id: tradeId } });
    if (!trade || (trade.buyerId !== userId && trade.sellerId !== userId)) throw new NotFoundException("Trade not found");
    return this.prisma.p2pTrade.update({ where: { id: tradeId }, data: { status: "APPEALING", disputeReason: reason } });
  }

  async getTrades(userId: string) {
    return this.prisma.p2pTrade.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: { offer: { select: { currency: true, fiatCurrency: true, paymentMethod: true } } },
      orderBy: { createdAt: "desc" }, take: 50,
    });
  }
}
