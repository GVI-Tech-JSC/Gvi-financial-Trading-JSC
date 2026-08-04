/**
 * VNKR Trade — Binary Options Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { WalletService }  from "../wallet/wallet.service";
import { PlaceBinaryOrderDto } from "./dto/binary.dto";
import { Decimal }        from "@prisma/client/runtime/library";

@Injectable()
export class BinaryService {
  constructor(
    private prisma:   PrismaService,
    private wallets:  WalletService,
  ) {}

  async getMarkets() {
    return this.prisma.binaryMarket.findMany({ where: { status: true } });
  }

  async getMarket(symbol: string) {
    const m = await this.prisma.binaryMarket.findUnique({ where: { symbol } });
    if (!m) throw new NotFoundException(`Binary market ${symbol} not found`);
    return m;
  }

  async getSettings() {
    return this.prisma.setting.findMany({ where: { group: "binary" } });
  }

  async placeOrder(userId: string, dto: PlaceBinaryOrderDto) {
    const market = await this.getMarket(dto.symbol);

    // Get current price as open price
    const openPrice = await this.getMockPrice(dto.symbol);

    // Check & deduct balance
    await this.wallets.assertBalance(userId, "SPOT", "USDT", dto.amount);
    await this.wallets.deductBalance(userId, "SPOT", "USDT", dto.amount);

    const expiresAt = new Date(Date.now() + dto.duration * 1000);

    return this.prisma.binaryOrder.create({
      data: {
        userId,
        marketId:  market.id,
        side:      dto.side,
        amount:    new Decimal(dto.amount),
        openPrice: new Decimal(openPrice),
        expiresAt,
      },
    });
  }

  async getOrders(userId: string, status?: "pending"|"closed") {
    const now = new Date();
    return this.prisma.binaryOrder.findMany({
      where: {
        userId,
        ...(status === "pending" ? { result: null, expiresAt: { gt: now } } : {}),
        ...(status === "closed"  ? { result: { not: null } }               : {}),
      },
      orderBy:  { createdAt: "desc" },
      take:     100,
      include:  { market: true },
    });
  }

  async getLeaderboard() {
    // Top 10 users by total binary profit
    const result = await this.prisma.binaryOrder.groupBy({
      by:       ["userId"],
      where:    { result: "WIN" },
      _sum:     { profit: true },
      orderBy:  { _sum: { profit: "desc" } },
      take:     10,
    });
    return result.map((r, i) => ({
      rank:       i + 1,
      userId:     r.userId,
      totalProfit: Number(r._sum.profit ?? 0),
    }));
  }

  private async getMockPrice(symbol: string): Promise<number> {
    const prices: Record<string, number> = {
      "BTC/USDT": 65000, "ETH/USDT": 3500, "BNB/USDT": 600, "SOL/USDT": 150,
    };
    return prices[symbol] ?? 100;
  }
}
