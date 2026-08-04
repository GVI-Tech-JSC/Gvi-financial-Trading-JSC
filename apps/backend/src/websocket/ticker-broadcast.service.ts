/**
 * VNKR Trade — Ticker Broadcast Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Polls CCXT every N seconds → broadcasts via Socket.IO
 */
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TradeGateway }  from "./websocket.gateway";
import { CcxtProvider }  from "../modules/exchange/ccxt.provider";

@Injectable()
export class TickerBroadcastService implements OnModuleInit, OnModuleDestroy {
  private readonly logger    = new Logger(TickerBroadcastService.name);
  private subscribedSymbols  = new Set<string>();
  private running            = false;

  // Default popular pairs to broadcast on startup
  private readonly DEFAULT_SYMBOLS = [
    "BTC/USDT","ETH/USDT","BNB/USDT","SOL/USDT","XRP/USDT",
    "ADA/USDT","DOGE/USDT","AVAX/USDT","DOT/USDT","MATIC/USDT",
  ];

  constructor(
    private gateway: TradeGateway,
    private ccxt:    CcxtProvider,
  ) {}

  onModuleInit() {
    this.DEFAULT_SYMBOLS.forEach(s => this.subscribedSymbols.add(s));
    this.running = true;
    this.logger.log(`Ticker broadcast ready — ${this.subscribedSymbols.size} default pairs`);
  }

  onModuleDestroy() { this.running = false; }

  subscribe(symbol: string) { this.subscribedSymbols.add(symbol); }
  unsubscribe(symbol: string) { this.subscribedSymbols.delete(symbol); }

  // ── Broadcast tickers every 3 seconds ─────────────────────
  @Cron("*/3 * * * * *")
  async broadcastTickers() {
    if (!this.running || this.subscribedSymbols.size === 0) return;
    try {
      const symbols = [...this.subscribedSymbols];
      const tickers = await this.ccxt.getTickers(symbols);
      tickers.forEach(ticker => {
        this.gateway.broadcastTicker(ticker.symbol, ticker);
      });
    } catch (e: any) {
      this.logger.warn(`Ticker broadcast error: ${e.message}`);
    }
  }

  // ── Broadcast orderbook for active rooms every 2s ──────────
  @Cron("*/2 * * * * *")
  async broadcastOrderbooks() {
    if (!this.running) return;
    // Only broadcast for symbols with active subscribers
    const rooms = this.gateway.getActiveOrderbookRooms();
    for (const symbol of rooms) {
      try {
        const ob = await this.ccxt.getOrderBook(symbol, 20);
        this.gateway.broadcastOrderbook(symbol, ob);
      } catch (e: any) {
        this.logger.warn(`Orderbook broadcast [${symbol}]: ${e.message}`);
      }
    }
  }
}
