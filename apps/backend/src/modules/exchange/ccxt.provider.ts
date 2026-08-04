/**
 * VNKR Trade — CCXT Exchange Provider
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Wraps CCXT with caching, error handling, sandbox support
 */
import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as ccxt from "ccxt";

export interface OHLCVBar {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

export interface OrderBookLevel { price: number; amount: number; }
export interface NormalizedOrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  ts: number;
}

export interface NormalizedTicker {
  symbol: string; last: number; bid: number; ask: number;
  high: number; low: number; volume: number;
  change: number; changePct: number; timestamp: number;
}

@Injectable()
export class CcxtProvider implements OnModuleInit {
  private readonly logger = new Logger(CcxtProvider.name);
  private exchange: ccxt.Exchange;

  // Simple in-memory cache
  private tickerCache = new Map<string, { data: NormalizedTicker; ts: number }>();
  private marketCache: { data: any[]; ts: number } | null = null;
  private readonly TICKER_TTL  = 3_000;   // 3s
  private readonly MARKET_TTL  = 60_000;  // 60s

  async onModuleInit() {
    const id      = (process.env.CCXT_EXCHANGE || "binance") as keyof typeof ccxt;
    const sandbox = process.env.CCXT_SANDBOX === "true";

    const ExchangeClass = ccxt[id] as any;
    if (!ExchangeClass) throw new Error(`CCXT exchange "${id}" not found`);

    this.exchange = new ExchangeClass({
      apiKey:    process.env.CCXT_API_KEY    || "",
      secret:    process.env.CCXT_API_SECRET || "",
      enableRateLimit: true,
      options: { defaultType: "spot" },
    });

    if (sandbox && this.exchange.urls?.["test"]) {
      this.exchange.setSandboxMode(true);
      this.logger.log(`CCXT [${id}] sandbox mode enabled`);
    }

    try {
      await this.exchange.loadMarkets();
      this.logger.log(`CCXT [${id}] markets loaded — ${Object.keys(this.exchange.markets).length} pairs`);
    } catch (e: any) {
      this.logger.warn(`CCXT markets load warning: ${e.message}`);
    }
  }

  // ── Markets ─────────────────────────────────────────────────
  async getMarkets(): Promise<any[]> {
    if (this.marketCache && Date.now() - this.marketCache.ts < this.MARKET_TTL) {
      return this.marketCache.data;
    }
    await this.exchange.loadMarkets(true);
    const markets = Object.values(this.exchange.markets)
      .filter((m: any) => m.active && m.spot)
      .map((m: any) => ({
        symbol:    m.symbol,
        base:      m.base,
        quote:     m.quote,
        precision: m.precision,
        limits:    m.limits,
        makerFee:  m.maker ?? 0.001,
        takerFee:  m.taker ?? 0.001,
      }));
    this.marketCache = { data: markets, ts: Date.now() };
    return markets;
  }

  // ── Ticker ───────────────────────────────────────────────────
  async getTicker(symbol: string): Promise<NormalizedTicker> {
    const cached = this.tickerCache.get(symbol);
    if (cached && Date.now() - cached.ts < this.TICKER_TTL) return cached.data;

    const t = await this.exchange.fetchTicker(symbol);
    const data: NormalizedTicker = {
      symbol,
      last:      t.last      ?? 0,
      bid:       t.bid       ?? 0,
      ask:       t.ask       ?? 0,
      high:      t.high      ?? 0,
      low:       t.low       ?? 0,
      volume:    t.baseVolume ?? 0,
      change:    t.change    ?? 0,
      changePct: t.percentage ?? 0,
      timestamp: t.timestamp  ?? Date.now(),
    };
    this.tickerCache.set(symbol, { data, ts: Date.now() });
    return data;
  }

  async getTickers(symbols?: string[]): Promise<NormalizedTicker[]> {
    const raw = await this.exchange.fetchTickers(symbols);
    return Object.values(raw).map((t: any) => ({
      symbol:    t.symbol,
      last:      t.last      ?? 0,
      bid:       t.bid       ?? 0,
      ask:       t.ask       ?? 0,
      high:      t.high      ?? 0,
      low:       t.low       ?? 0,
      volume:    t.baseVolume ?? 0,
      change:    t.change    ?? 0,
      changePct: t.percentage ?? 0,
      timestamp: t.timestamp  ?? Date.now(),
    }));
  }

  // ── OHLCV ────────────────────────────────────────────────────
  async getCandles(symbol: string, timeframe = "1h", limit = 200): Promise<OHLCVBar[]> {
    const raw = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
    return raw.map(([time, open, high, low, close, volume]) => ({
      time: Math.floor(time / 1000), open, high, low, close, volume,
    }));
  }

  // ── Order Book ───────────────────────────────────────────────
  async getOrderBook(symbol: string, limit = 20): Promise<NormalizedOrderBook> {
    const ob = await this.exchange.fetchOrderBook(symbol, limit);
    return {
      symbol,
      bids: ob.bids.map(([price, amount]) => ({ price, amount })),
      asks: ob.asks.map(([price, amount]) => ({ price, amount })),
      ts: ob.timestamp ?? Date.now(),
    };
  }

  // ── Recent Trades ─────────────────────────────────────────────
  async getTrades(symbol: string, limit = 50) {
    const trades = await this.exchange.fetchTrades(symbol, undefined, limit);
    return trades.map(t => ({
      id:        t.id,
      symbol:    t.symbol,
      side:      t.side,
      price:     t.price,
      amount:    t.amount,
      cost:      t.cost,
      timestamp: t.timestamp,
    }));
  }

  // ── Exchange‑level order ops (used internally by OrderService) ─
  getRawExchange(): ccxt.Exchange { return this.exchange; }
}
