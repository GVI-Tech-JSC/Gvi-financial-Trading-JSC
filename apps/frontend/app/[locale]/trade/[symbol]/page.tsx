"use client";
/**
 * VNKR Trade — Spot Trading Page  /[locale]/trade/[symbol]
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Layout: MarketList | Chart + OrderBook | OrderForm
 */
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useTradeStore } from "@/store/trade.store";
import { useWalletStore } from "@/store/wallet.store";
import { walletApi } from "@/lib/api";
import { useTickerSocket, useOrderBookSocket } from "@/hooks/useTradeSocket";
import MarketList   from "@/components/trading-panel/MarketList";
import OrderForm    from "@/components/trading-panel/OrderForm";
import OpenOrders   from "@/components/trading-panel/OpenOrders";
import OrderBook    from "@/components/orderbook/OrderBook";

// Chart is client-only (uses DOM APIs)
const TradingChart = dynamic(() => import("@/components/charts/TradingChart"), {
  ssr: false,
  loading: () => (
    <div className="bg-surface rounded-lg border border-border h-[420px] flex items-center justify-center text-muted text-sm">
      Loading chart...
    </div>
  ),
});

export default function TradePage() {
  const params = useParams();
  const rawSymbol = typeof params.symbol === "string" ? params.symbol : "BTC-USDT";
  const symbol  = rawSymbol.replace("-", "/").toUpperCase();

  const { setSymbol, setTicker, setOrderBook, ticker } = useTradeStore();
  const { setWallets } = useWalletStore();

  // Set active symbol from URL
  useEffect(() => { setSymbol(symbol); }, [symbol]);

  // Load wallets
  useEffect(() => {
    walletApi.getWallets()
      .then(({ data }) => setWallets(data))
      .catch(() => {});
  }, []);

  // Real-time ticker via WebSocket
  useTickerSocket(symbol, (data) => setTicker(data));

  // Real-time order book via WebSocket
  useOrderBookSocket(symbol, (data) => setOrderBook(data));

  const [base, quote] = symbol.split("/");
  const changePct     = ticker?.changePct ?? 0;

  return (
    <div className="flex flex-col h-screen bg-bg text-white overflow-hidden">

      {/* ── Top bar ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 bg-surface border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">{symbol}</span>
          {ticker && (
            <>
              <span className={`text-xl font-bold ${changePct >= 0 ? "text-green-400" : "text-red-400"}`}>
                {ticker.last.toFixed(2)}
              </span>
              <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                changePct >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
              }`}>
                {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
              </span>
            </>
          )}
        </div>
        {ticker && (
          <div className="flex gap-6 ml-4 text-xs text-muted">
            <div><span>24h High </span><span className="text-white font-medium">{ticker.high.toFixed(2)}</span></div>
            <div><span>24h Low </span><span className="text-white font-medium">{ticker.low.toFixed(2)}</span></div>
            <div><span>24h Vol </span><span className="text-white font-medium">{ticker.volume.toLocaleString()}</span></div>
          </div>
        )}
        <div className="ml-auto flex gap-2 text-xs text-muted">
          <a href="../.." className="hover:text-white">← Markets</a>
          <a href="/vi/finance/wallet" className="hover:text-white">Wallet</a>
          <a href="/vi/finance/deposit" className="hover:text-white">Deposit</a>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden gap-1 p-1">

        {/* Left: Market list */}
        <div className="w-52 shrink-0 overflow-hidden">
          <MarketList />
        </div>

        {/* Center: Chart + Orders */}
        <div className="flex-1 flex flex-col gap-1 overflow-hidden min-w-0">
          <TradingChart symbol={symbol} />
          <div className="flex-1 overflow-hidden">
            <OpenOrders />
          </div>
        </div>

        {/* Right: OrderBook + OrderForm */}
        <div className="w-64 shrink-0 flex flex-col gap-1 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <OrderBook />
          </div>
          <OrderForm />
        </div>
      </div>
    </div>
  );
}
