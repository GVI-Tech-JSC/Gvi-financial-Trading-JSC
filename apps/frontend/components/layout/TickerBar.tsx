"use client";
/**
 * VNKR Trade — TickerBar
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useEffect, useState } from "react";
import { exchangeApi } from "@/lib/api";

interface TickerItem {
  symbol: string; last: number; changePct: number; volume: number;
}

const HOT_PAIRS = ["BTC/USDT","ETH/USDT","BNB/USDT","SOL/USDT","XRP/USDT","ADA/USDT"];

export default function TickerBar() {
  const [tickers, setTickers] = useState<TickerItem[]>([]);

  useEffect(() => {
    const load = () =>
      exchangeApi.getTickers(HOT_PAIRS)
        .then(({ data }) => setTickers(data))
        .catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full bg-surface border-b border-border overflow-hidden">
      <div className="flex items-center gap-6 px-4 py-1.5 overflow-x-auto scrollbar-hide">
        {tickers.map(t => (
          <div key={t.symbol} className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-white">{t.symbol}</span>
            <span className="text-xs font-semibold">{t.last.toFixed(2)}</span>
            <span className={`text-xs font-medium ${t.changePct >= 0 ? "text-green-400" : "text-red-400"}`}>
              {t.changePct >= 0 ? "+" : ""}{t.changePct.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
