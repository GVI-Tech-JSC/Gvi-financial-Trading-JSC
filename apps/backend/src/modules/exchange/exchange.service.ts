import { Injectable, Logger } from "@nestjs/common";
import { CcxtProvider }  from "./ccxt.provider";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ExchangeService {
  private readonly logger = new Logger(ExchangeService.name);
  constructor(private ccxt: CcxtProvider, private prisma: PrismaService) {}

  async getMarkets()                                 { return this.ccxt.getMarkets(); }
  async getTicker(symbol: string)                    { return this.ccxt.getTicker(symbol); }
  async getTickers(symbols?: string[])               { return this.ccxt.getTickers(symbols); }
  async getOrderBook(symbol: string)                 { return this.ccxt.getOrderBook(symbol); }
  async getOhlcv(symbol: string, tf = "1h")          { return this.ccxt.getCandles(symbol, tf); }
  async getTrades(symbol: string)                    { return this.ccxt.getTrades(symbol); }

  async getAvailableCurrencies() {
    const markets = await this.ccxt.getMarkets();
    const set = new Set<string>();
    markets.forEach((m: any) => { if (m.base) set.add(m.base); if (m.quote) set.add(m.quote); });
    return Array.from(set).sort();
  }

  async searchMarkets(q: string) {
    const markets = await this.ccxt.getMarkets();
    return markets.filter((m: any) => m.symbol?.toLowerCase().includes(q.toLowerCase()));
  }
}
