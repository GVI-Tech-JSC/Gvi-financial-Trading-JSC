"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { walletApi } from "@/lib/api";
import { useWalletStore } from "@/store/wallet.store";

export default function WalletPage() {
  const params  = useParams();
  const locale  = params.locale as string;
  const { wallets, loading, setWallets, setLoading } = useWalletStore();

  useEffect(() => {
    setLoading(true);
    walletApi.getWallets()
      .then(({ data }) => setWallets(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const total = wallets.reduce((s, w) => s + Number(w.balance), 0);

  return (
    <div className="min-h-screen bg-bg text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Wallets</h1>
          <div className="flex gap-2">
            <Link href={`/${locale}/finance/deposit`}
              className="px-4 py-2 bg-brand text-white rounded text-sm font-medium hover:opacity-90">
              Deposit
            </Link>
            <Link href={`/${locale}/finance/withdraw`}
              className="px-4 py-2 bg-white/10 text-white rounded text-sm font-medium hover:bg-white/20">
              Withdraw
            </Link>
          </div>
        </div>

        <div className="bg-surface rounded-lg border border-border p-4 mb-4">
          <p className="text-muted text-sm">Total Balance (est.)</p>
          <p className="text-3xl font-bold mt-1">{total.toFixed(4)} <span className="text-muted text-lg">USDT</span></p>
        </div>

        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs border-b border-border">
                <th className="text-left px-4 py-3">Currency</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Balance</th>
                <th className="text-right px-4 py-3">In Order</th>
                <th className="text-right px-4 py-3">Available</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted">Loading...</td></tr>
              ) : wallets.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted">No wallets yet</td></tr>
              ) : wallets.map((w: any) => (
                <tr key={w.id} className="border-b border-border/50 hover:bg-white/5">
                  <td className="px-4 py-3 font-semibold">{w.currency}</td>
                  <td className="px-4 py-3 text-muted">{w.type}</td>
                  <td className="px-4 py-3 text-right font-mono">{Number(w.balance).toFixed(8)}</td>
                  <td className="px-4 py-3 text-right text-muted font-mono">{Number(w.inOrder).toFixed(8)}</td>
                  <td className="px-4 py-3 text-right font-mono text-green-400">
                    {(Number(w.balance) - Number(w.inOrder)).toFixed(8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
