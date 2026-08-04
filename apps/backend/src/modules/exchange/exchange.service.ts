/**
 * VNKR Trade — Exchange Service (Market Data)
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { CcxtProvider }   from "./ccxt.provider";
import { CandleQueryDto, OrderBookQueryDto } from "./dto/market-query.dto";

@Injectable()
export class ExchangeService {
  constructor(
    private prisma:   PrismaService,
    private ccxt:     CcxtProvider,
  ) {}

  async getMarkets() {
    return this.ccxt.getMarkets();
  }

  async getTicker(symbol: string) {
    return this.ccxt.getTicker(symbol);
  }

  async getTickers(symbols?: string[]) {
    return this.ccxt.getTickers(symbols);
  }

  async getCandles(dto: CandleQueryDto) {
    return this.ccxt.getCandles(dto.symbol, dto.timeframe ?? "1h", dto.limit ?? 200);
  }

  async getOrderBook(dto: OrderBookQueryDto) {
    return this.ccxt.getOrderBook(dto.symbol, dto.limit ?? 20);
  }

  async getTrades(symbol: string, limit = 50) {
    return this.ccxt.getTrades(symbol, limit);
  }

  async getWatchlist(userId: string) {
    return this.prisma.exchangeMarket.findMany({
      where: { status: true },
      orderBy: { symbol: "asc" },
      take: 100,
    });
  }

  async getCurrencies() {
    return this.prisma.currency.findMany({ where: { status: true } });
  }

  async getTradingSettings() {
    return this.prisma.setting.findMany({ where: { group: "exchange" } });
  }
}
