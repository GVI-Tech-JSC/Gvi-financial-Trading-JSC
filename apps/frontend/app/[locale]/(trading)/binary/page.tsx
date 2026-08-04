"use client";
import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";

interface BinaryOrder {
  id: string;
  symbol: string;
  direction: "RISE" | "FALL";
  amount: number;
  entryPrice: number;
  expiresAt: string;
  status: "PENDING" | "WON" | "LOST" | "CANCELLED";
  payout: number;
}

const SYMBOLS  = ["BTC/USDT","ETH/USDT","SOL/USDT","BNB/USDT","XRP/USDT"];
const AMOUNTS  = [5,10,25,50,100,250];
const EXPIRIES = [{ label:"30s", value:30 },{ label:"1m", value:60 },{ label:"2m", value:120 },{ label:"5m", value:300 }];

export default function BinaryPage() {
  const [symbol, setSymbol]   = useState("BTC/USDT");
  const [amount, setAmount]   = useState(10);
  const [expiry, setExpiry]   = useState(60);
  const [orders, setOrders]   = useState<BinaryOrder[]>([]);
  const [price, setPrice]     = useState<number | null>(null);
  const [priceHistory, setHistory] = useState<number[]>([]);
  const [msg, setMsg]         = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Poll current price
  useEffect(() => {
    let id: NodeJS.Timeout;
    async function fetchPrice() {
      try {
        const r = await api.get(`/exchange/ticker/${symbol.replace("/","-")}`);
        const p = r.data?.last ?? r.data?.close ?? null;
        if (p) {
          setPrice(p);
          setHistory(h => [...h.slice(-79), p]);
        }
      } catch {}
    }
    fetchPrice();
    id = setInterval(fetchPrice, 2000);
    return () => clearInterval(id);
  }, [symbol]);

  // Draw mini sparkline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceHistory.length < 2) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    const min = Math.min(...priceHistory), max = Math.max(...priceHistory);
    const range = max - min || 1;
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    priceHistory.forEach((p, i) => {
      const x = (i / (priceHistory.length - 1)) * w;
      const y = h - ((p - min) / range) * (h - 8) - 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [priceHistory]);

  useEffect(() => {
    api.get("/exchange/binary/my").then(r => setOrders(r.data?.data ?? [])).catch(() => {});
  }, []);

  async function place(direction: "RISE"|"FALL") {
    setLoading(true); setMsg("");
    try {
      await api.post("/exchange/binary/place", { symbol, direction, amount, expirySeconds: expiry });
      setMsg(`Order placed — ${direction}!`);
      const r = await api.get("/exchange/binary/my");
      setOrders(r.data?.data ?? []);
    } catch (e: any) { setMsg(e?.response?.data?.message ?? "Error"); }
    finally { setLoading(false); }
  }

  const pending = orders.filter(o => o.status === "PENDING");
  const history = orders.filter(o => o.status !== "PENDING");
  const winCount = history.filter(o => o.status === "WON").length;
  const winRate  = history.length ? (winCount / history.length * 100).toFixed(0) : "—";

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Binary Options</h1>
          <p className="text-[#8b949e] mt-1">Predict RISE or FALL — 85% payout on win</p>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes("!") ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-red-900/40 text-red-400 border border-red-800"}`}>{msg}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart + Price */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <select value={symbol} onChange={e => { setSymbol(e.target.value); setHistory([]); }}
                  className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-sm font-semibold">
                  {SYMBOLS.map(s => <option key={s}>{s}</option>)}
                </select>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono">{price?.toLocaleString(undefined,{maximumFractionDigits:2}) ?? "—"}</div>
                  <div className="text-xs text-[#8b949e]">Current Price</div>
                </div>
              </div>
              <canvas ref={canvasRef} width={560} height={120} className="w-full rounded-lg bg-[#0d1117]" />
            </div>

            {/* Active orders */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <h2 className="text-base font-semibold mb-3">Active Positions ({pending.length})</h2>
              {pending.length === 0 ? (
                <div className="text-center text-[#8b949e] py-4 text-sm">No active positions</div>
              ) : (
                <div className="space-y-2">
                  {pending.map(o => {
                    const secsLeft = Math.max(0, Math.floor((new Date(o.expiresAt).getTime() - Date.now()) / 1000));
                    return (
                      <div key={o.id} className="flex items-center gap-4 bg-[#0d1117] rounded-lg p-3 text-sm">
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${o.direction==="RISE" ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"}`}>{o.direction}</span>
                        <span className="font-medium">{o.symbol}</span>
                        <span className="text-[#8b949e]">${o.entryPrice?.toFixed(2)}</span>
                        <span className="ml-auto font-semibold">${o.amount}</span>
                        <span className="text-yellow-400 font-mono text-xs">{secsLeft}s</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* History */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold">History</h2>
                {history.length > 0 && <span className="text-sm text-[#8b949e]">Win rate: <span className="text-white font-semibold">{winRate}%</span></span>}
              </div>
              {history.length === 0 ? (
                <div className="text-center text-[#8b949e] py-4 text-sm">No history yet</div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {history.slice(0,20).map(o => (
                    <div key={o.id} className="flex items-center gap-4 text-sm px-2 py-1.5 rounded hover:bg-[#0d1117]">
                      <span className={`w-12 text-xs font-bold ${o.status==="WON"?"text-green-400":"text-red-400"}`}>{o.status}</span>
                      <span className={`text-xs px-1.5 rounded ${o.direction==="RISE"?"bg-green-900/30 text-green-400":"bg-red-900/30 text-red-400"}`}>{o.direction}</span>
                      <span>{o.symbol}</span>
                      <span className="ml-auto">${o.amount}</span>
                      {o.status === "WON" && <span className="text-green-400">+${(o.payout - o.amount).toFixed(2)}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order form */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 h-fit">
            <h2 className="text-base font-semibold mb-4">Place Order</h2>

            <div className="mb-4">
              <label className="text-xs text-[#8b949e] mb-2 block">Amount (USDT)</label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => setAmount(a)}
                    className={`py-1.5 rounded-lg text-sm ${amount===a ? "bg-[#3b82f6] text-white" : "bg-[#21262d] text-[#8b949e] hover:text-white"}`}>
                    ${a}
                  </button>
                ))}
              </div>
              <input type="number" value={amount} onChange={e => setAmount(+e.target.value)} min={1}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6]" />
            </div>

            <div className="mb-4">
              <label className="text-xs text-[#8b949e] mb-2 block">Expiry</label>
              <div className="grid grid-cols-4 gap-1.5">
                {EXPIRIES.map(e => (
                  <button key={e.value} onClick={() => setExpiry(e.value)}
                    className={`py-1.5 rounded-lg text-xs ${expiry===e.value ? "bg-[#3b82f6] text-white" : "bg-[#21262d] text-[#8b949e] hover:text-white"}`}>
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#0d1117] rounded-lg p-3 mb-4 text-xs space-y-1 text-[#8b949e]">
              <div className="flex justify-between"><span>Payout</span><span className="text-green-400 font-bold">${(amount * 1.85).toFixed(2)} (85%)</span></div>
              <div className="flex justify-between"><span>Risk</span><span className="text-red-400">${amount}</span></div>
            </div>

            <button onClick={() => place("RISE")} disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 mb-2 transition-colors">
              ▲ RISE
            </button>
            <button onClick={() => place("FALL")} disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
              ▼ FALL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
