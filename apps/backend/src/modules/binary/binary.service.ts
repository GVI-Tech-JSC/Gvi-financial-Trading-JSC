/**
 * VNKR Trade — Binary Options Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { WalletService }  from "../wallet/wallet.service";
import { PlaceBinaryOrderDto } from "./dto/binary.dto";
import { Decimal }        from "@prisma/client/runtime/library";

@Injectable()
export class BinaryService {
  private readonly logger = new Logger(BinaryService.name);
  constructor(private prisma: PrismaService, private wallets: WalletService) {}

  async placeOrder(userId: string, dto: PlaceBinaryOrderDto) {
    await this.wallets.assertBalance(userId, "SPOT", "USDT", dto.amount);
    await this.wallets.deductBalance(userId, "SPOT", "USDT", dto.amount);
    const entryPrice = this.getMockPrice(dto.symbol);
    const expiresAt  = new Date(Date.now() + (dto.expirySeconds ?? 60) * 1000);
    return this.prisma.binaryOrder.create({
      data: { userId, symbol: dto.symbol, direction: dto.direction, amount: new Decimal(dto.amount), entryPrice: new Decimal(entryPrice), expiresAt, status: "PENDING" },
    });
  }

  async getOrders(userId: string) {
    return this.prisma.binaryOrder.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 });
  }

  async getLeaderboard() {
    return this.prisma.binaryOrder.groupBy({
      by: ["userId"], where: { status: "WON" }, _sum: { payout: true },
      orderBy: { _sum: { payout: "desc" } }, take: 10,
    });
  }

  private getMockPrice(symbol: string): number {
    const p: Record<string, number> = { "BTC/USDT": 65000, "ETH/USDT": 3500, "BNB/USDT": 600, "SOL/USDT": 150 };
    return p[symbol] ?? 100;
  }
}
