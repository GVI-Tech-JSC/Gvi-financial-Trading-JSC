"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface P2pOffer {
  id: string;
  type: "BUY" | "SELL";
  currency: string;
  fiatCurrency: string;
  price: number;
  minAmount: number;
  maxAmount: number;
  paymentMethod: string;
  seller?: { firstName: string; lastName: string };
  buyer?: { firstName: string; lastName: string };
}

const METHODS = ["Bank Transfer","MoMo","ZaloPay","ViettelPay","Cash"];
const FIATS   = ["VND","USD","EUR"];
const CRYPTOS = ["USDT","BTC","ETH","VNKR"];

export default function P2PPage() {
  const [tab, setTab] = useState<"BUY"|"SELL">("BUY");
  const [offers, setOffers] = useState<P2pOffer[]>([]);
  const [filter, setFilter] = useState({ currency:"USDT", fiatCurrency:"VND" });
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ type:"SELL" as "BUY"|"SELL", currency:"USDT", fiatCurrency:"VND", price:"", minAmount:"", maxAmount:"", paymentMethod:"Bank Transfer", terms:"" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/p2p/offers", { params: { ...filter, type: tab } })
      .then(r => setOffers(r.data?.data ?? []))
      .catch(() => {});
  }, [tab, filter]);

  async function createOffer() {
    setLoading(true); setMsg("");
    try {
      await api.post("/p2p/offers", { ...form, price: +form.price, minAmount: +form.minAmount, maxAmount: +form.maxAmount });
      setMsg("Offer created!"); setShowCreate(false);
      const r = await api.get("/p2p/offers", { params: { ...filter, type: tab } });
      setOffers(r.data?.data ?? []);
    } catch (e: any) { setMsg(e?.response?.data?.message ?? "Error"); }
    finally { setLoading(false); }
  }

  async function initTrade(offerId: string) {
    const amtStr = prompt("Enter amount to trade:");
    if (!amtStr) return;
    try {
      await api.post("/p2p/trades", { offerId, amount: parseFloat(amtStr) });
      setMsg("Trade initiated! Check your trades.");
    } catch (e: any) { setMsg(e?.response?.data?.message ?? "Error"); }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">P2P Trading</h1>
            <p className="text-[#8b949e] mt-1">Buy & sell crypto peer-to-peer, secured by escrow</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg font-semibold">
            + Post Offer
          </button>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes("!") ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-red-900/40 text-red-400 border border-red-800"}`}>
            {msg}
          </div>
        )}

        {/* Tabs + Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex bg-[#161b22] border border-[#30363d] rounded-lg p-1">
            {(["BUY","SELL"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-1.5 rounded-md text-sm font-semibold transition-colors ${tab === t ? (t==="BUY"?"bg-green-600 text-white":"bg-red-600 text-white") : "text-[#8b949e] hover:text-white"}`}>
                {t}
              </button>
            ))}
          </div>
          <select value={filter.currency} onChange={e => setFilter(f=>({...f,currency:e.target.value}))}
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-sm">
            {CRYPTOS.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filter.fiatCurrency} onChange={e => setFilter(f=>({...f,fiatCurrency:e.target.value}))}
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-1.5 text-sm">
            {FIATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Offers table */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#30363d] text-[#8b949e]">
                <th className="text-left px-4 py-3">Advertiser</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Limits</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-[#8b949e]">No offers found</td></tr>
              )}
              {offers.map(o => {
                const user = o.type === "SELL" ? o.seller : o.buyer;
                const name = user ? `${user.firstName} ${user.lastName}` : "Anonymous";
                return (
                  <tr key={o.id} className="border-b border-[#21262d] hover:bg-[#0d1117]/50">
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      {o.price.toLocaleString()} <span className="text-[#8b949e] text-xs">{o.fiatCurrency}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#8b949e]">
                      {o.minAmount} – {o.maxAmount} <span className="text-xs">{o.currency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-[#21262d] text-xs px-2 py-0.5 rounded">{o.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => initTrade(o.id)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${tab==="BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
                        {tab === "BUY" ? "Buy" : "Sell"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Create Offer Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Post New Offer</h2>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(["BUY","SELL"] as const).map(t => (
                    <button key={t} onClick={() => setForm(f=>({...f,type:t}))}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold ${form.type===t ? (t==="BUY"?"bg-green-600":"bg-red-600") : "bg-[#21262d] text-[#8b949e]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {[
                  { label:"Crypto", key:"currency", type:"select", opts:CRYPTOS },
                  { label:"Fiat", key:"fiatCurrency", type:"select", opts:FIATS },
                  { label:"Payment", key:"paymentMethod", type:"select", opts:METHODS },
                  { label:"Price per unit", key:"price", type:"number", placeholder:"e.g. 25000" },
                  { label:"Min amount", key:"minAmount", type:"number", placeholder:"e.g. 10" },
                  { label:"Max amount", key:"maxAmount", type:"number", placeholder:"e.g. 1000" },
                  { label:"Terms (optional)", key:"terms", type:"text", placeholder:"Payment within 15 min..." },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-[#8b949e] mb-1 block">{f.label}</label>
                    {f.type === "select" ? (
                      <select value={(form as any)[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm">
                        {f.opts!.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                        onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm placeholder-[#484f58] focus:outline-none focus:border-[#3b82f6]" />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCreate(false)} className="flex-1 py-2 rounded-lg border border-[#30363d] text-[#8b949e] hover:text-white text-sm">Cancel</button>
                <button onClick={createOffer} disabled={loading} className="flex-1 py-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] font-semibold text-sm disabled:opacity-50">
                  {loading ? "Posting…" : "Post Offer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
