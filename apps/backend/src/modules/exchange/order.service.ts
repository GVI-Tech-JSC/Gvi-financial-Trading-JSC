/**
 * VNKR Trade — Order Service (Spot Trading)
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import {
  Injectable, BadRequestException, NotFoundException, Logger,
} from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { CcxtProvider }   from "./ccxt.provider";
import { WalletService }  from "../wallet/wallet.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { Decimal }        from "@prisma/client/runtime/library";

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma:  PrismaService,
    private ccxt:    CcxtProvider,
    private wallets: WalletService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const { symbol, side, type, amount, price } = dto;

    // 1. Determine quote/base and check balance
    const [base, quote] = symbol.split("/");
    const currency = side === "BUY" ? quote : base;
    const required  = side === "BUY"
      ? (price ? amount * price : amount)
      : amount;

    await this.wallets.assertBalance(userId, "SPOT", currency, required);

    // 2. Lock funds (inOrder)
    await this.wallets.lockFunds(userId, "SPOT", currency, required);

    // 3. Place on CCXT exchange (skip if sandbox/no API key)
    let referenceId: string | undefined;
    let filledPrice = price ?? 0;
    let filled      = 0;

    try {
      const ex    = this.ccxt.getRawExchange();
      const order = await ex.createOrder(
        symbol,
        type.toLowerCase() as any,
        side.toLowerCase() as any,
        amount,
        price,
      );
      referenceId = order.id;
      filledPrice = order.average ?? order.price ?? price ?? 0;
      filled      = order.filled  ?? 0;
    } catch (e: any) {
      // If no API key configured, record as OPEN local order
      this.logger.warn(`CCXT order skipped (no API or sandbox): ${e.message}`);
    }

    // 4. Persist to DB
    const dbOrder = await this.prisma.exchangeOrder.create({
      data: {
        userId,
        symbol,
        side,
        type,
        timeInForce: dto.timeInForce ?? "GTC",
        status:      filled >= amount ? "CLOSED" : "OPEN",
        price:       new Decimal(price ?? 0),
        amount:      new Decimal(amount),
        filled:      new Decimal(filled),
        remaining:   new Decimal(amount - filled),
        cost:        new Decimal(filledPrice * filled),
        fee:         new Decimal(0),
        feeCurrency: quote,
        referenceId,
      },
    });

    // 5. If fully filled, unlock + deduct funds
    if (filled >= amount) {
      await this.wallets.unlockFunds(userId, "SPOT", currency, required);
      await this.wallets.deductBalance(userId, "SPOT", currency, required);
      // Credit received asset
      const receive   = side === "BUY" ? base : quote;
      const received  = side === "BUY" ? filled : filledPrice * filled;
      await this.wallets.creditBalance(userId, "SPOT", receive, received);
    }

    return dbOrder;
  }

  async getOrders(userId: string, status?: string, symbol?: string) {
    return this.prisma.exchangeOrder.findMany({
      where: {
        userId,
        ...(status ? { status: status as any } : {}),
        ...(symbol ? { symbol } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getOrder(userId: string, id: string) {
    const order = await this.prisma.exchangeOrder.findFirst({ where: { id, userId } });
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  async cancelOrder(userId: string, id: string) {
    const order = await this.prisma.exchangeOrder.findFirst({
      where: { id, userId, status: "OPEN" },
    });
    if (!order) throw new NotFoundException("Open order not found");

    // Cancel on exchange
    try {
      const ex = this.ccxt.getRawExchange();
      if (order.referenceId) await ex.cancelOrder(order.referenceId, order.symbol);
    } catch (e: any) {
      this.logger.warn(`Cancel on exchange failed: ${e.message}`);
    }

    // Unlock funds
    const [base, quote] = order.symbol.split("/");
    const currency = order.side === "BUY" ? quote : base;
    const locked   = order.side === "BUY"
      ? Number(order.price) * Number(order.remaining)
      : Number(order.remaining);

    await this.wallets.unlockFunds(userId, "SPOT", currency, locked);

    return this.prisma.exchangeOrder.update({
      where: { id },
      data:  { status: "CANCELED", remaining: new Decimal(0) },
    });
  }

  async getOpenOrders(userId: string) {
    return this.getOrders(userId, "OPEN");
  }

  async getOrderHistory(userId: string) {
    return this.getOrders(userId);
  }
}
