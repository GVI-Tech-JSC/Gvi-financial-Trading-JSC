"use client";
/**
 * VNKR Trade — OrderForm (Spot)
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useState } from "react";
import { exchangeApi } from "@/lib/api";
import { useTradeStore } from "@/store/trade.store";
import { useWalletStore } from "@/store/wallet.store";

type Side     = "BUY" | "SELL";
type OrdType  = "LIMIT" | "MARKET";

export default function OrderForm() {
  const { symbol, ticker }  = useTradeStore();
  const { getBalance }      = useWalletStore();

  const [side,     setSide]   = useState<Side>("BUY");
  const [ordType,  setOrdType]= useState<OrdType>("LIMIT");
  const [price,    setPrice]  = useState("");
  const [amount,   setAmount] = useState("");
  const [loading,  setLoading]= useState(false);
  const [msg,      setMsg]    = useState<{text:string;ok:boolean}|null>(null);

  const [base, quote] = symbol.split("/");
  const balanceCcy    = side === "BUY" ? quote : base;
  const balance       = getBalance(balanceCcy, "SPOT");
  const lastPrice     = ticker?.last ?? 0;
  const total         = ordType === "LIMIT"
    ? (parseFloat(price) || 0) * (parseFloat(amount) || 0)
    : lastPrice * (parseFloat(amount) || 0);

  const setPct = (pct: number) => {
    if (side === "BUY" && lastPrice > 0) {
      const maxAmount = (balance * pct) / 100 / (parseFloat(price) || lastPrice);
      setAmount(maxAmount.toFixed(6));
    } else {
      setAmount(((balance * pct) / 100).toFixed(6));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      await exchangeApi.createOrder({
        symbol,
        side,
        type: ordType,
        amount: parseFloat(amount),
        ...(ordType === "LIMIT" ? { price: parseFloat(price) } : {}),
      });
      setMsg({ text: `${side} order placed successfully`, ok: true });
      setAmount("");
      setPrice("");
    } catch (err: any) {
      setMsg({ text: err.response?.data?.message || "Order failed", ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-3">
      <h3 className="text-sm font-semibold text-white mb-3">Place Order</h3>

      {/* BUY / SELL tabs */}
      <div className="flex rounded overflow-hidden mb-3 text-sm font-semibold">
        <button onClick={() => setSide("BUY")}
          className={`flex-1 py-2 transition-colors ${side==="BUY" ? "bg-green-600 text-white" : "bg-white/5 text-muted hover:text-white"}`}>
          Buy {base}
        </button>
        <button onClick={() => setSide("SELL")}
          className={`flex-1 py-2 transition-colors ${side==="SELL" ? "bg-red-600 text-white" : "bg-white/5 text-muted hover:text-white"}`}>
          Sell {base}
        </button>
      </div>

      {/* LIMIT / MARKET tabs */}
      <div className="flex gap-2 mb-3 text-xs">
        {(["LIMIT","MARKET"] as OrdType[]).map(t => (
          <button key={t} onClick={() => setOrdType(t)}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              ordType===t ? "bg-brand text-white" : "text-muted hover:text-white"
            }`}>{t}</button>
        ))}
      </div>

      {/* Balance */}
      <div className="flex justify-between text-xs text-muted mb-3">
        <span>Available</span>
        <span className="text-white font-medium">{balance.toFixed(4)} {balanceCcy}</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        {/* Price field (LIMIT only) */}
        {ordType === "LIMIT" && (
          <div className="relative">
            <input
              type="number" step="any" placeholder="Price"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-white placeholder-muted focus:border-brand outline-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{quote}</span>
          </div>
        )}
        {ordType === "MARKET" && (
          <div className="px-3 py-2 bg-bg border border-border rounded text-xs text-muted">
            Market price ≈ {lastPrice.toFixed(2)} {quote}
          </div>
        )}

        {/* Amount */}
        <div className="relative">
          <input
            type="number" step="any" placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-white placeholder-muted focus:border-brand outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{base}</span>
        </div>

        {/* % shortcuts */}
        <div className="flex gap-1">
          {[25,50,75,100].map(p => (
            <button key={p} type="button" onClick={() => setPct(p)}
              className="flex-1 py-1 text-xs bg-white/5 hover:bg-white/10 text-muted hover:text-white rounded transition-colors">
              {p}%
            </button>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between text-xs text-muted">
          <span>Total</span>
          <span className="text-white">{total.toFixed(4)} {quote}</span>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading || !amount}
          className={`w-full py-2.5 rounded font-semibold text-sm text-white transition-colors disabled:opacity-50 ${
            side === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
          }`}>
          {loading ? "Placing..." : `${side} ${base}`}
        </button>
      </form>

      {msg && (
        <p className={`mt-2 text-xs text-center ${msg.ok ? "text-green-400" : "text-red-400"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
