/**
 * VNKR Trade — P2P Trading Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Escrow-based P2P: lock seller funds → buyer pays fiat → release crypto
 */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { WalletService }  from "../wallet/wallet.service";
import { Decimal }        from "@prisma/client/runtime/library";
import { CreateOfferDto, CreateTradeDto, ConfirmPaymentDto, DisputeDto } from "./dto/p2p.dto";

@Injectable()
export class P2pService {
  private readonly logger = new Logger(P2pService.name);

  constructor(
    private prisma:  PrismaService,
    private wallets: WalletService,
  ) {}

  // ── Offers ─────────────────────────────────────────────────
  async getOffers(params: {
    side?: string; currency?: string; fiatCurrency?: string;
    page?: number; limit?: number;
  }) {
    const { side, currency, fiatCurrency, page = 1, limit = 20 } = params;
    const where: any = {
      status: "ACTIVE",
      ...(side         ? { side: side as any }         : {}),
      ...(currency     ? { currency }                  : {}),
      ...(fiatCurrency ? { fiatCurrency }              : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.p2pOffer.findMany({
        where, skip: (page-1)*limit, take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      }),
      this.prisma.p2pOffer.count({ where }),
    ]);
    return { items, total, page };
  }

  async getMyOffers(userId: string) {
    return this.prisma.p2pOffer.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      include: { trades: { take: 5, orderBy: { createdAt: "desc" } } },
    });
  }

  async createOffer(userId: string, dto: CreateOfferDto) {
    // SELL offer: lock crypto in escrow
    if (dto.side === "SELL") {
      await this.wallets.assertBalance(userId, "SPOT", dto.currency, dto.available);
      await this.wallets.lockFunds(userId, "SPOT", dto.currency, dto.available);
    }
    return this.prisma.p2pOffer.create({
      data: {
        userId,
        side:           dto.side,
        currency:       dto.currency,
        fiatCurrency:   dto.fiatCurrency,
        price:          new Decimal(dto.price),
        minAmount:      new Decimal(dto.minAmount),
        maxAmount:      new Decimal(dto.maxAmount),
        available:      new Decimal(dto.available),
        paymentMethods: dto.paymentMethods ?? [],
        terms:          dto.terms,
        status:         "ACTIVE",
      },
    });
  }

  async cancelOffer(userId: string, offerId: string) {
    const offer = await this.prisma.p2pOffer.findFirst({
      where: { id: offerId, userId, status: "ACTIVE" },
    });
    if (!offer) throw new NotFoundException("Active offer not found");

    // Unlock escrowed funds for SELL offers
    if (offer.side === "SELL") {
      await this.wallets.unlockFunds(userId, "SPOT", offer.currency, Number(offer.available));
    }
    return this.prisma.p2pOffer.update({
      where: { id: offerId },
      data:  { status: "CANCELLED" },
    });
  }

  // ── Trades ─────────────────────────────────────────────────
  async createTrade(buyerId: string, dto: CreateTradeDto) {
    const offer = await this.prisma.p2pOffer.findFirst({
      where: { id: dto.offerId, status: "ACTIVE" },
    });
    if (!offer) throw new NotFoundException("Offer not found or inactive");
    if (offer.userId === buyerId) throw new BadRequestException("Cannot trade your own offer");
    if (dto.amount < Number(offer.minAmount) || dto.amount > Number(offer.maxAmount))
      throw new BadRequestException(`Amount must be between ${offer.minAmount} and ${offer.maxAmount}`);
    if (dto.amount > Number(offer.available))
      throw new BadRequestException("Insufficient offer availability");

    const fiatAmount = dto.amount * Number(offer.price);

    // For BUY offers (seller is the ad poster): lock buyer crypto
    if (offer.side === "BUY") {
      await this.wallets.assertBalance(buyerId, "SPOT", offer.currency, dto.amount);
      await this.wallets.lockFunds(buyerId, "SPOT", offer.currency, dto.amount);
    }

    const [trade] = await this.prisma.$transaction([
      this.prisma.p2pTrade.create({
        data: {
          offerId:    offer.id,
          buyerId,
          amount:     new Decimal(dto.amount),
          price:      offer.price,
          fiatAmount: new Decimal(fiatAmount),
          status:     "PENDING",
        },
      }),
      this.prisma.p2pOffer.update({
        where: { id: offer.id },
        data:  { available: { decrement: dto.amount } },
      }),
    ]);

    this.logger.log(`P2P trade created: ${trade.id} — ${dto.amount} ${offer.currency}`);
    return trade;
  }

  async confirmPayment(userId: string, dto: ConfirmPaymentDto) {
    const trade = await this.prisma.p2pTrade.findFirst({
      where: { id: dto.tradeId, buyerId: userId, status: "PENDING" },
      include: { offer: true },
    });
    if (!trade) throw new NotFoundException("Pending trade not found");

    return this.prisma.p2pTrade.update({
      where: { id: dto.tradeId },
      data:  { status: "PAID", paymentProof: dto.paymentProof },
    });
  }

  async releaseFunds(userId: string, tradeId: string) {
    const trade = await this.prisma.p2pTrade.findFirst({
      where:   { id: tradeId, status: "PAID" },
      include: { offer: true },
    });
    if (!trade) throw new NotFoundException("Paid trade not found");

    // Only the seller (offer owner for SELL / buyer for BUY) can release
    const offer = trade.offer;
    const isSeller = offer.userId === userId;
    const isBuyer  = trade.buyerId === userId;
    if (!isSeller && !isBuyer)
      throw new ForbiddenException("Not authorized to release funds");

    const sellerId = offer.side === "SELL" ? offer.userId : trade.buyerId;
    const receiverId = offer.side === "SELL" ? trade.buyerId : offer.userId;

    await this.prisma.$transaction([
      // Mark trade complete
      this.prisma.p2pTrade.update({
        where: { id: tradeId },
        data:  { status: "COMPLETED", releasedAt: new Date() },
      }),
      // Release crypto from escrow to buyer
      this.prisma.wallet.updateMany({
        where: { userId: sellerId, type: "SPOT", currency: offer.currency },
        data:  { inOrder: { decrement: Number(trade.amount) } },
      }),
      this.prisma.wallet.updateMany({
        where: { userId: receiverId, type: "SPOT", currency: offer.currency },
        data:  { balance: { increment: Number(trade.amount) } },
      }),
    ]);

    return { released: true, amount: Number(trade.amount), currency: offer.currency };
  }

  async openDispute(userId: string, dto: DisputeDto) {
    const trade = await this.prisma.p2pTrade.findFirst({
      where: {
        id: dto.tradeId,
        status: "PAID",
        OR: [{ buyerId: userId }, { offer: { userId } }],
      },
    });
    if (!trade) throw new NotFoundException("Trade not found or not disputable");
    return this.prisma.p2pTrade.update({
      where: { id: dto.tradeId },
      data:  { status: "APPEALING" },
    });
  }

  async getTrades(userId: string, status?: string) {
    return this.prisma.p2pTrade.findMany({
      where: {
        OR: [{ buyerId: userId }, { offer: { userId } }],
        ...(status ? { status: status as any } : {}),
      },
      include: { offer: { select: { currency: true, fiatCurrency: true, side: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  // ── Admin ──────────────────────────────────────────────────
  async adminGetDisputes() {
    return this.prisma.p2pTrade.findMany({
      where:   { status: "APPEALING" },
      include: { offer: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async adminResolveTrade(tradeId: string, releaseToUserId: string) {
    const trade = await this.prisma.p2pTrade.findUnique({
      where: { id: tradeId }, include: { offer: true },
    });
    if (!trade) throw new NotFoundException("Trade not found");

    await this.prisma.$transaction([
      this.prisma.p2pTrade.update({
        where: { id: tradeId },
        data:  { status: "COMPLETED", releasedAt: new Date() },
      }),
      this.prisma.wallet.updateMany({
        where: { userId: releaseToUserId, type: "SPOT", currency: trade.offer.currency },
        data:  { balance: { increment: Number(trade.amount) } },
      }),
    ]);

    return { resolved: true };
  }
}
