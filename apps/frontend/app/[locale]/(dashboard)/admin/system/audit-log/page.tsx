"use client";
/**
 * VNKR Trade — Audit Log Page
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function AuditLogPage() {
  const params  = useParams();
  const locale  = params.locale as string;
  const [logs,  setLogs]  = useState<any[]>([]);
  const [page,  setPage]  = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("/api/admin/audit-log", { params: { page, limit: 30 } })
      .then(({ data }) => { setLogs(data.items ?? []); setTotal(data.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const actionColor = (action: string) => {
    if (action.startsWith("BAN") || action.includes("DELETE")) return "text-red-400";
    if (action.startsWith("UPDATE") || action.startsWith("ADJUST")) return "text-yellow-400";
    if (action.startsWith("CREATE")) return "text-green-400";
    return "text-brand";
  };

  return (
    <div className="min-h-screen bg-bg text-white p-6">
      <div className="max-w-6xl mx-auto">
        <Link href={`/${locale}/admin`} className="text-xs text-muted hover:text-white">← Dashboard</Link>
        <h1 className="text-xl font-bold mt-1 mb-6">Audit Log</h1>

        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted border-b border-border">
                <th className="text-left px-4 py-3">Time</th>
                <th className="text-left px-4 py-3">Admin</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Entity</th>
                <th className="text-left px-4 py-3">Entity ID</th>
                <th className="text-left px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-muted">Loading...</td></tr>
              ) : logs.map((l: any) => (
                <tr key={l.id} className="border-b border-border/50 hover:bg-white/5">
                  <td className="px-4 py-2 text-muted whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2">{l.user?.email ?? l.userId ?? "system"}</td>
                  <td className={`px-4 py-2 font-semibold ${actionColor(l.action)}`}>{l.action}</td>
                  <td className="px-4 py-2 text-muted">{l.entity ?? "—"}</td>
                  <td className="px-4 py-2 text-muted font-mono text-xs truncate max-w-[120px]">
                    {l.entityId ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted">{l.ipAddress ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 30 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(p => p-1)}
              className="px-3 py-1.5 bg-surface border border-border rounded text-sm disabled:opacity-40 hover:bg-white/10">
              ← Prev
            </button>
            <span className="text-sm text-muted">Page {page} / {Math.ceil(total/30)}</span>
            <button disabled={page >= Math.ceil(total/30)} onClick={() => setPage(p => p+1)}
              className="px-3 py-1.5 bg-surface border border-border rounded text-sm disabled:opacity-40 hover:bg-white/10">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
