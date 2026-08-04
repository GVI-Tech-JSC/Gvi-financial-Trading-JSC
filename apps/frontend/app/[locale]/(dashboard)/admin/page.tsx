"use client";
/**
 * VNKR Trade — Admin Dashboard
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

interface KPI {
  users:        { total: number; active: number };
  kyc:          { pending: number };
  transactions: { total: number; pendingWithdraw: number };
  trading:      { openOrders: number; openPositions: number };
  revenue:      { total: number };
}

function KpiCard({ label, value, sub, color = "brand" }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  const colors: Record<string, string> = {
    brand: "border-brand/40 bg-brand/5",
    green: "border-green-500/40 bg-green-500/5",
    red:   "border-red-500/40 bg-red-500/5",
    yellow:"border-yellow-500/40 bg-yellow-500/5",
  };
  return (
    <div className={`rounded-lg border p-4 ${colors[color] ?? colors.brand}`}>
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const params  = useParams();
  const locale  = params.locale as string;
  const [kpi,  setKpi]  = useState<KPI | null>(null);
  const [logs,  setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/dashboard"),
      api.get("/api/admin/activity?limit=8"),
    ])
      .then(([kpiRes, logRes]) => {
        setKpi(kpiRes.data);
        setLogs(logRes.data?.items ?? logRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const navItems = [
    { label: "Users",         href: `/${locale}/admin/crm/user`,               icon: "👥" },
    { label: "KYC",           href: `/${locale}/admin/crm/kyc/application`,     icon: "🪪" },
    { label: "Transactions",  href: `/${locale}/admin/finance/transaction`,      icon: "💳" },
    { label: "Spot Orders",   href: `/${locale}/admin/finance/order/exchange`,   icon: "📊" },
    { label: "Futures Orders",href: `/${locale}/admin/finance/order/futures`,    icon: "📈" },
    { label: "Binary Orders", href: `/${locale}/admin/finance/order/binary`,     icon: "🎯" },
    { label: "Wallets",       href: `/${locale}/admin/finance/wallet`,           icon: "👛" },
    { label: "Revenue",       href: `/${locale}/admin/finance/profit`,           icon: "💰" },
    { label: "Extensions",    href: `/${locale}/admin/system/extension`,         icon: "🧩" },
    { label: "Settings",      href: `/${locale}/admin/system/settings`,          icon: "⚙️" },
    { label: "Audit Log",     href: `/${locale}/admin/system/audit-log`,         icon: "📋" },
    { label: "Support",       href: `/${locale}/admin/crm/support`,              icon: "🎫" },
  ];

  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Top bar */}
      <div className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-brand">VNKR</span>
          <span className="text-muted text-sm">Admin Panel</span>
        </div>
        <div className="flex gap-4 text-xs text-muted">
          <span>GVI Tech JSC</span>
          <Link href={`/${locale}/trade/BTC-USDT`} className="hover:text-white">← Trading</Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 bg-surface border-r border-border min-h-screen p-3">
          <nav className="flex flex-col gap-0.5">
            {navItems.map(n => (
              <Link key={n.href} href={n.href}
                className="flex items-center gap-2 px-3 py-2 rounded text-sm text-muted hover:text-white hover:bg-white/5 transition-colors">
                <span>{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <h1 className="text-xl font-bold mb-6">Dashboard</h1>

          {loading ? (
            <p className="text-muted">Loading...</p>
          ) : kpi ? (
            <>
              {/* KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <KpiCard label="Total Users"     value={kpi.users.total}
                  sub={`${kpi.users.active} active`} color="brand" />
                <KpiCard label="Pending KYC"     value={kpi.kyc.pending}       color="yellow" />
                <KpiCard label="Total Txns"      value={kpi.transactions.total}
                  sub={`${kpi.transactions.pendingWithdraw} pending withdraw`} color="green" />
                <KpiCard label="Revenue (USDT)"  value={kpi.revenue.total.toFixed(2)} color="green" />
                <KpiCard label="Open Spot Orders"  value={kpi.trading.openOrders}    color="brand" />
                <KpiCard label="Open Positions"    value={kpi.trading.openPositions} color="brand" />
                <KpiCard label="Pending Withdraw"  value={kpi.transactions.pendingWithdraw} color="red" />
                <KpiCard label="Active Users"      value={kpi.users.active}           color="green" />
              </div>

              {/* Recent Audit Log */}
              <div className="bg-surface rounded-lg border border-border">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Recent Activity</h2>
                  <Link href={`/${locale}/admin/system/audit-log`}
                    className="text-xs text-brand hover:underline">View all</Link>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted border-b border-border">
                      <th className="text-left px-4 py-2">Time</th>
                      <th className="text-left px-4 py-2">User</th>
                      <th className="text-left px-4 py-2">Action</th>
                      <th className="text-left px-4 py-2">Entity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-4 text-muted">No activity yet</td></tr>
                    ) : logs.map((l: any) => (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-white/5">
                        <td className="px-4 py-2 text-muted">
                          {new Date(l.createdAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-2">{l.user?.email ?? l.userId ?? "—"}</td>
                        <td className="px-4 py-2 font-medium text-brand">{l.action}</td>
                        <td className="px-4 py-2 text-muted">{l.entity ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-red-400">Failed to load dashboard data</p>
          )}
        </main>
      </div>
    </div>
  );
}
