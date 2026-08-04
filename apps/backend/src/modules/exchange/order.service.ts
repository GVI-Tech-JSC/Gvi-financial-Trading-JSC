import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService }   from "../../prisma/prisma.service";
import { WalletService }   from "../wallet/wallet.service";
import { Decimal }         from "@prisma/client/runtime/library";
import { CreateOrderDto }  from "./dto/create-order.dto";
import { CcxtProvider }    from "./ccxt.provider";

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(private prisma: PrismaService, private wallets: WalletService, private ccxt: CcxtProvider) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const [base, quote] = dto.symbol.split("/");
    if (!base || !quote) throw new BadRequestException("Invalid symbol format");
    const ticker     = await this.ccxt.getTicker(dto.symbol).catch(() => null);
    const markPrice  = ticker?.last ?? dto.price ?? 0;
    const totalCost  = dto.type === "MARKET"
      ? dto.amount * markPrice
      : dto.amount * (dto.price ?? markPrice);

    if (dto.side === "BUY") {
      await this.wallets.assertBalance(userId, "SPOT", quote, totalCost);
      await this.wallets.lockFunds(userId, "SPOT", quote, totalCost);
    } else {
      await this.wallets.assertBalance(userId, "SPOT", base, dto.amount);
      await this.wallets.lockFunds(userId, "SPOT", base, dto.amount);
    }

    const order = await this.prisma.exchangeOrder.create({
      data: {
        userId, symbol: dto.symbol, side: dto.side as any, type: dto.type as any,
        price:     dto.price ? new Decimal(dto.price) : null,
        amount:    new Decimal(dto.amount),
        remaining: new Decimal(dto.amount),
        status:    "OPEN",
      },
    });

    // Auto-fill MARKET orders immediately
    if (dto.type === "MARKET") {
      await this.fillOrder(order.id, markPrice, dto.amount);
    }

    return order;
  }

  async fillOrder(orderId: string, fillPrice: number, fillAmount: number) {
    const order = await this.prisma.exchangeOrder.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException("Order not found");
    const [base, quote] = order.symbol.split("/");
    const cost   = fillAmount * fillPrice;
    const fee    = cost * 0.001; // 0.1%

    await this.prisma.$transaction(async tx => {
      await tx.exchangeOrder.update({
        where: { id: orderId },
        data:  { filled: new Decimal(fillAmount), remaining: new Decimal(0), cost: new Decimal(cost), fee: new Decimal(fee), status: "CLOSED", closedAt: new Date() },
      });
      if (order.side === "BUY") {
        await tx.wallet.updateMany({ where: { userId: order.userId, type: "SPOT", currency: quote }, data: { balance: { decrement: cost + fee }, lockedBalance: { decrement: cost } } });
        await tx.wallet.upsert({ where: { userId_currency_type: { userId: order.userId, currency: base!, type: "SPOT" } }, create: { userId: order.userId, currency: base!, type: "SPOT", balance: new Decimal(fillAmount), lockedBalance: new Decimal(0) }, update: { balance: { increment: fillAmount } } });
      } else {
        await tx.wallet.updateMany({ where: { userId: order.userId, type: "SPOT", currency: base }, data: { balance: { decrement: fillAmount }, lockedBalance: { decrement: fillAmount } } });
        await tx.wallet.upsert({ where: { userId_currency_type: { userId: order.userId, currency: quote!, type: "SPOT" } }, create: { userId: order.userId, currency: quote!, type: "SPOT", balance: new Decimal(cost - fee), lockedBalance: new Decimal(0) }, update: { balance: { increment: cost - fee } } });
      }
    });
    return { filled: fillAmount, price: fillPrice };
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.exchangeOrder.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) throw new NotFoundException("Order not found");
    if (order.status !== "OPEN") throw new BadRequestException("Order cannot be cancelled");
    const [base, quote] = order.symbol.split("/");
    const remaining     = Number(order.remaining);
    if (order.side === "BUY") {
      const refund = remaining * (order.price ? Number(order.price) : 0);
      if (refund > 0) await this.wallets.unlockFunds(userId, "SPOT", quote!, refund);
    } else {
      await this.wallets.unlockFunds(userId, "SPOT", base!, remaining);
    }
    return this.prisma.exchangeOrder.update({ where: { id: orderId }, data: { status: "CANCELED", closedAt: new Date() } });
  }

  async getOrders(userId: string, symbol?: string, status?: string) {
    return this.prisma.exchangeOrder.findMany({
      where: { userId, ...(symbol ? { symbol } : {}), ...(status ? { status: status as any } : {}) },
      orderBy: { createdAt: "desc" }, take: 100,
    });
  }
}
