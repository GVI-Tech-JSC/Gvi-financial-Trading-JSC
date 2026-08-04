"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface Position {
  id: string;
  symbol: string;
  side: "LONG" | "SHORT";
  size: number;
  entryPrice: number;
  markPrice: number;
  leverage: number;
  margin: number;
  unrealizedPnl: number;
  liquidationPrice: number;
  status: string;
}

const SYMBOLS = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT"];
const LEVERAGES = [1,2,3,5,10,20,50,100];

export default function FuturesPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [symbol, setSymbol] = useState("BTC/USDT");
  const [side, setSide] = useState<"LONG"|"SHORT">("LONG");
  const [leverage, setLeverage] = useState(10);
  const [margin, setMargin] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [markPrice, setMarkPrice] = useState<Record<string,number>>({});

  useEffect(() => {
    api.get("/futures/positions").then(r => setPositions(r.data?.data ?? [])).catch(() => {});
    // Fetch mark prices
    SYMBOLS.forEach(sym => {
      api.get(`/exchange/ticker/${sym.replace("/","-")}`)
        .then(r => { if (r.data?.last) setMarkPrice(p => ({...p, [sym]: r.data.last})); })
        .catch(() => {});
    });
  }, []);

  async function openPosition() {
    if (!margin) return;
    setLoading(true); setMsg("");
    try {
      await api.post("/futures/positions", { symbol, side, leverage, margin: parseFloat(margin) });
      setMsg("Position opened!");
      setMargin("");
      const r = await api.get("/futures/positions");
      setPositions(r.data?.data ?? []);
    } catch (e: any) { setMsg(e?.response?.data?.message ?? "Error"); }
    finally { setLoading(false); }
  }

  async function closePosition(id: string) {
    setLoading(true);
    try {
      await api.post(`/futures/positions/${id}/close`);
      setMsg("Position closed!");
      const r = await api.get("/futures/positions");
      setPositions(r.data?.data ?? []);
    } catch (e: any) { setMsg(e?.response?.data?.message ?? "Error"); }
    finally { setLoading(false); }
  }

  const openPos = positions.filter(p => p.status === "OPEN");
  const totalPnl = openPos.reduce((s, p) => s + (p.unrealizedPnl ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Futures Trading</h1>
          <p className="text-[#8b949e] mt-1">Trade perpetual futures with up to 100× leverage</p>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes("!") ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-red-900/40 text-red-400 border border-red-800"}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order panel */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Open Position</h2>

            {/* Symbol */}
            <div className="mb-3">
              <label className="text-xs text-[#8b949e] mb-1 block">Symbol</label>
              <select value={symbol} onChange={e => setSymbol(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm">
                {SYMBOLS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Side */}
            <div className="flex gap-2 mb-3">
              {(["LONG","SHORT"] as const).map(s => (
                <button key={s} onClick={() => setSide(s)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${side === s ? (s==="LONG" ? "bg-green-600" : "bg-red-600") : "bg-[#21262d] text-[#8b949e] hover:text-white"}`}>
                  {s}
                </button>
              ))}
            </div>

            {/* Leverage */}
            <div className="mb-3">
              <label className="text-xs text-[#8b949e] mb-1 block">Leverage: {leverage}×</label>
              <div className="flex flex-wrap gap-1">
                {LEVERAGES.map(l => (
                  <button key={l} onClick={() => setLeverage(l)}
                    className={`px-2 py-0.5 rounded text-xs ${leverage===l ? "bg-[#3b82f6] text-white" : "bg-[#21262d] text-[#8b949e] hover:text-white"}`}>
                    {l}×
                  </button>
                ))}
              </div>
            </div>

            {/* Margin */}
            <div className="mb-4">
              <label className="text-xs text-[#8b949e] mb-1 block">Margin (USDT)</label>
              <input type="number" placeholder="0.00" value={margin} onChange={e => setMargin(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm placeholder-[#484f58] focus:outline-none focus:border-[#3b82f6]" />
            </div>

            {margin && (
              <div className="bg-[#0d1117] rounded-lg p-3 mb-4 text-xs space-y-1 text-[#8b949e]">
                <div className="flex justify-between"><span>Position size</span><span className="text-white">{(parseFloat(margin||"0") * leverage).toFixed(2)} USDT</span></div>
                <div className="flex justify-between"><span>Mark price</span><span className="text-white">${markPrice[symbol]?.toLocaleString() ?? "—"}</span></div>
              </div>
            )}

            <button onClick={openPosition} disabled={loading || !margin}
              className={`w-full py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 ${side==="LONG" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
              {loading ? "Processing…" : `Open ${side}`}
            </button>
          </div>

          {/* Positions */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Open Positions ({openPos.length})</h2>
              <div className={`text-sm font-semibold ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
                Total PnL: {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(2)} USDT
              </div>
            </div>

            {openPos.length === 0 ? (
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-12 text-center text-[#8b949e]">No open positions</div>
            ) : (
              <div className="space-y-3">
                {openPos.map(pos => {
                  const pnlPct = pos.margin ? ((pos.unrealizedPnl ?? 0) / pos.margin * 100) : 0;
                  return (
                    <div key={pos.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{pos.symbol}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-bold ${pos.side==="LONG" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>{pos.side}</span>
                          <span className="text-xs bg-[#21262d] px-2 py-0.5 rounded text-[#8b949e]">{pos.leverage}×</span>
                        </div>
                        <div className={`font-bold ${(pos.unrealizedPnl??0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {(pos.unrealizedPnl??0) >= 0 ? "+" : ""}{(pos.unrealizedPnl??0).toFixed(4)} USDT
                          <span className="text-xs ml-1">({pnlPct >= 0 ? "+" : ""}{pnlPct.toFixed(2)}%)</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                        <div><div className="text-[#8b949e] text-xs">Entry</div><div>${pos.entryPrice?.toFixed(2)}</div></div>
                        <div><div className="text-[#8b949e] text-xs">Mark</div><div>${pos.markPrice?.toFixed(2) ?? "—"}</div></div>
                        <div><div className="text-[#8b949e] text-xs">Liq. Price</div><div className="text-red-400">${pos.liquidationPrice?.toFixed(2)}</div></div>
                        <div><div className="text-[#8b949e] text-xs">Margin</div><div>${pos.margin?.toFixed(2)}</div></div>
                      </div>
                      <button onClick={() => closePosition(pos.id)} disabled={loading}
                        className="w-full py-1.5 rounded-lg text-sm border border-[#30363d] hover:border-red-500 hover:text-red-400 transition-colors">
                        Close Position
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
