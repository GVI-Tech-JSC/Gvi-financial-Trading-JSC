"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { exchangeApi } from "@/lib/api";

export default function MarketsPage() {
  const params   = useParams();
  const locale   = params.locale as string;
  const [tickers, setTickers] = useState<any[]>([]);
  const [search,  setSearch]  = useState("");
  const [sort,    setSort]    = useState<"volume"|"change"|"price">("volume");

  useEffect(() => {
    exchangeApi.getTickers()
      .then(({ data }) => setTickers(data))
      .catch(() => {});
    const id = setInterval(() => {
      exchangeApi.getTickers()
        .then(({ data }) => setTickers(data))
        .catch(() => {});
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const filtered = tickers
    .filter(t => t.symbol.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === "volume") return b.volume - a.volume;
      if (sort === "change") return b.changePct - a.changePct;
      return b.last - a.last;
    });

  return (
    <div className="min-h-screen bg-bg text-white p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Markets</h1>

        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search market..."
            className="px-3 py-2 bg-surface border border-border rounded text-sm text-white placeholder-muted outline-none focus:border-brand w-48"
          />
          <div className="flex gap-1">
            {(["volume","change","price"] as const).map(s => (
              <button key={s} onClick={() => setSort(s)}
                className={`px-3 py-2 text-xs rounded font-medium capitalize transition-colors ${
                  sort===s ? "bg-brand text-white" : "bg-surface text-muted hover:text-white border border-border"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted border-b border-border text-xs">
                <th className="text-left px-4 py-3">Pair</th>
                <th className="text-right px-4 py-3">Last Price</th>
                <th className="text-right px-4 py-3">24h Change</th>
                <th className="text-right px-4 py-3">24h High</th>
                <th className="text-right px-4 py-3">24h Low</th>
                <th className="text-right px-4 py-3">Volume</th>
                <th className="text-center px-4 py-3">Trade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => {
                const chg   = t.changePct ?? 0;
                const slug  = t.symbol.replace("/", "-");
                return (
                  <tr key={t.symbol} className="border-b border-border/50 hover:bg-white/5">
                    <td className="px-4 py-3 font-semibold">{t.symbol}</td>
                    <td className="px-4 py-3 text-right font-mono">{t.last?.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${chg>=0?"text-green-400":"text-red-400"}`}>
                      {chg>=0?"+":""}{chg.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right text-muted">{t.high?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-muted">{t.low?.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-muted">{Number(t.volume).toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/${locale}/trade/${slug}`}
                        className="px-3 py-1 bg-brand/20 text-brand hover:bg-brand hover:text-white rounded text-xs font-medium transition-colors">
                        Trade
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
