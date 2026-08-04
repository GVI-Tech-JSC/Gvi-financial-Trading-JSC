"use client";
/**
 * VNKR Trade — OrderBook Component
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useMemo } from "react";
import { useTradeStore } from "@/store/trade.store";

function PriceRow({
  price, amount, total, side, maxTotal,
}: {
  price: number; amount: number; total: number;
  side: "bid" | "ask"; maxTotal: number;
}) {
  const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  return (
    <div className="relative flex justify-between text-xs py-px px-2 hover:bg-white/5 cursor-pointer">
      <div
        className={`absolute inset-y-0 ${side === "bid" ? "left-0 bg-success/10" : "right-0 bg-danger/10"}`}
        style={{ width: `${pct}%` }}
      />
      <span className={side === "bid" ? "text-green-400" : "text-red-400"}>
        {price.toFixed(2)}
      </span>
      <span className="text-muted">{amount.toFixed(6)}</span>
      <span className="text-muted">{total.toFixed(4)}</span>
    </div>
  );
}

export default function OrderBook() {
  const { orderBook, ticker } = useTradeStore();

  const { bids, asks, maxBidTotal, maxAskTotal } = useMemo(() => {
    if (!orderBook) return { bids: [], asks: [], maxBidTotal: 0, maxAskTotal: 0 };
    let bidRunning = 0, askRunning = 0;
    const bids = orderBook.bids.slice(0, 16).map(b => ({
      ...b, total: (bidRunning += b.amount),
    }));
    const asks = orderBook.asks.slice(0, 16).map(a => ({
      ...a, total: (askRunning += a.amount),
    }));
    return {
      bids,
      asks: asks.reverse(),
      maxBidTotal: bidRunning,
      maxAskTotal: askRunning,
    };
  }, [orderBook]);

  const spread = useMemo(() => {
    if (!orderBook?.bids[0] || !orderBook?.asks[0]) return 0;
    return orderBook.asks[0].price - orderBook.bids[0].price;
  }, [orderBook]);

  return (
    <div className="bg-surface rounded-lg border border-border h-full flex flex-col">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-white">Order Book</h3>
      </div>

      {/* Header */}
      <div className="flex justify-between text-xs text-muted px-2 py-1 border-b border-border">
        <span>Price</span><span>Amount</span><span>Total</span>
      </div>

      {/* Asks (sells) — reversed so lowest ask at bottom */}
      <div className="flex-1 overflow-hidden flex flex-col justify-end">
        {asks.map((a, i) => (
          <PriceRow key={i} price={a.price} amount={a.amount}
            total={a.total} side="ask" maxTotal={maxAskTotal} />
        ))}
      </div>

      {/* Spread */}
      <div className="flex justify-between px-2 py-1 border-y border-border bg-surface/50">
        <span className="text-xs text-white font-semibold">
          {ticker ? ticker.last.toFixed(2) : "—"}
        </span>
        <span className="text-xs text-muted">
          Spread: {spread > 0 ? spread.toFixed(2) : "—"}
        </span>
      </div>

      {/* Bids (buys) */}
      <div className="flex-1 overflow-hidden">
        {bids.map((b, i) => (
          <PriceRow key={i} price={b.price} amount={b.amount}
            total={b.total} side="bid" maxTotal={maxBidTotal} />
        ))}
      </div>
    </div>
  );
}
