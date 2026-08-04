"use client";
/**
 * VNKR Trade — MarketList
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useEffect, useState } from "react";
import { exchangeApi } from "@/lib/api";
import { useTradeStore } from "@/store/trade.store";

export default function MarketList() {
  const { symbol, setSymbol } = useTradeStore();
  const [markets, setMarkets] = useState<any[]>([]);
  const [tickers, setTickers] = useState<Record<string, any>>({});
  const [search,  setSearch]  = useState("");
  const [quote,   setQuote]   = useState("USDT");

  useEffect(() => {
    exchangeApi.getMarkets()
      .then(({ data }) => setMarkets(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = () => {
      const filtered = markets
        .filter(m => m.quote === quote)
        .slice(0, 40)
        .map(m => m.symbol);
      if (filtered.length === 0) return;
      exchangeApi.getTickers(filtered)
        .then(({ data }) => {
          const map: Record<string, any> = {};
          data.forEach((t: any) => { map[t.symbol] = t; });
          setTickers(map);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [markets, quote]);

  const filtered = markets.filter(m =>
    m.quote === quote &&
    m.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-surface border border-border rounded-lg flex flex-col h-full">
      {/* Quote tabs */}
      <div className="flex border-b border-border">
        {["USDT","BTC","ETH","BNB"].map(q => (
          <button key={q} onClick={() => setQuote(q)}
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              quote === q ? "text-brand border-b-2 border-brand" : "text-muted hover:text-white"
            }`}>
            {q}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-2 py-1.5 border-b border-border">
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className="w-full bg-bg border border-border rounded px-2 py-1 text-xs text-white placeholder-muted outline-none focus:border-brand"
        />
      </div>

      {/* Column headers */}
      <div className="flex justify-between px-2 py-1 text-xs text-muted border-b border-border">
        <span>Pair</span><span>Price</span><span>Change</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.slice(0, 60).map(m => {
          const t   = tickers[m.symbol];
          const chg = t?.changePct ?? 0;
          return (
            <button key={m.symbol} onClick={() => setSymbol(m.symbol)}
              className={`w-full flex justify-between items-center px-2 py-1.5 text-xs hover:bg-white/5 transition-colors ${
                symbol === m.symbol ? "bg-brand/10 text-brand" : "text-white"
              }`}>
              <span className="font-medium">{m.base}<span className="text-muted">/{m.quote}</span></span>
              <span>{t ? t.last.toFixed(t.last < 1 ? 6 : 2) : "—"}</span>
              <span className={chg >= 0 ? "text-green-400" : "text-red-400"}>
                {chg >= 0 ? "+" : ""}{chg.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
