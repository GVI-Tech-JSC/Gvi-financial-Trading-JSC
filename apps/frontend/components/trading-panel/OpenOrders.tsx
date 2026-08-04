"use client";
/**
 * VNKR Trade — OpenOrders Panel
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useEffect, useState } from "react";
import { exchangeApi } from "@/lib/api";
import { useTradeStore } from "@/store/trade.store";

export default function OpenOrders() {
  const { symbol }    = useTradeStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [tab,    setTab]    = useState<"open"|"history">("open");
  const [loading,setLoading]= useState(false);

  const load = () => {
    setLoading(true);
    const req = tab === "open"
      ? exchangeApi.getOpenOrders()
      : exchangeApi.getOrders({ status: "CLOSED" });
    req.then(({ data }) => setOrders(data))
       .catch(() => setOrders([]))
       .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const cancel = async (id: string) => {
    await exchangeApi.cancelOrder(id).catch(() => {});
    load();
  };

  return (
    <div className="bg-surface rounded-lg border border-border">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["open","history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-semibold capitalize transition-colors ${
              tab === t ? "text-white border-b-2 border-brand" : "text-muted hover:text-white"
            }`}>
            {t === "open" ? "Open Orders" : "Order History"}
          </button>
        ))}
        <button onClick={load}
          className="ml-auto px-3 py-2 text-xs text-muted hover:text-white">
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted border-b border-border">
              <th className="text-left px-3 py-2">Time</th>
              <th className="text-left px-3 py-2">Symbol</th>
              <th className="text-left px-3 py-2">Side</th>
              <th className="text-left px-3 py-2">Type</th>
              <th className="text-right px-3 py-2">Price</th>
              <th className="text-right px-3 py-2">Amount</th>
              <th className="text-right px-3 py-2">Filled</th>
              <th className="text-right px-3 py-2">Status</th>
              {tab === "open" && <th className="px-3 py-2">Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-6 text-muted">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-6 text-muted">No orders</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} className="border-b border-border/50 hover:bg-white/5">
                <td className="px-3 py-2 text-muted">{new Date(o.createdAt).toLocaleTimeString()}</td>
                <td className="px-3 py-2 font-medium">{o.symbol}</td>
                <td className={`px-3 py-2 font-semibold ${o.side==="BUY" ? "text-green-400" : "text-red-400"}`}>{o.side}</td>
                <td className="px-3 py-2 text-muted">{o.type}</td>
                <td className="px-3 py-2 text-right">{Number(o.price).toFixed(2)}</td>
                <td className="px-3 py-2 text-right">{Number(o.amount).toFixed(6)}</td>
                <td className="px-3 py-2 text-right">{Number(o.filled).toFixed(6)}</td>
                <td className="px-3 py-2 text-right">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    o.status==="OPEN"   ? "bg-brand/20 text-brand" :
                    o.status==="CLOSED" ? "bg-green-500/20 text-green-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>{o.status}</span>
                </td>
                {tab === "open" && (
                  <td className="px-3 py-2">
                    <button onClick={() => cancel(o.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium">
                      Cancel
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
