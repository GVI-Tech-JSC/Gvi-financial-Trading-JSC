"use client";
/**
 * VNKR Trade — Admin Users Page
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function AdminUsersPage() {
  const params  = useParams();
  const locale  = params.locale as string;
  const [users,   setUsers]   = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get("/api/admin/crm/user", { params: { page, limit: 20, search: search||undefined, status: status||undefined } })
      .then(({ data }) => { setUsers(data.items ?? []); setTotal(data.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, status]);

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      ACTIVE:    "bg-green-500/20 text-green-400",
      INACTIVE:  "bg-gray-500/20 text-gray-400",
      SUSPENDED: "bg-yellow-500/20 text-yellow-400",
      BANNED:    "bg-red-500/20 text-red-400",
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? "bg-gray-500/20 text-gray-400"}`}>{s}</span>;
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="min-h-screen bg-bg text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href={`/${locale}/admin`} className="text-xs text-muted hover:text-white">← Dashboard</Link>
            <h1 className="text-xl font-bold mt-1">User Management</h1>
            <p className="text-xs text-muted">{total.toLocaleString()} total users</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && load()}
            placeholder="Search email / name..."
            className="px-3 py-2 bg-surface border border-border rounded text-sm text-white placeholder-muted outline-none focus:border-brand w-56"
          />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-surface border border-border rounded text-sm text-white outline-none focus:border-brand">
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>
          <button onClick={() => { setPage(1); load(); }}
            className="px-4 py-2 bg-brand text-white rounded text-sm font-medium hover:opacity-90">
            Search
          </button>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted text-xs border-b border-border">
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">KYC</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Last Login</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-center px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted">Loading...</td></tr>
              ) : users.map((u: any) => (
                <tr key={u.id} className="border-b border-border/50 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-muted">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      u.role === "admin" || u.role === "superadmin"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-brand/20 text-brand"
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white">
                      Lv.{u.kycLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">{statusBadge(u.status)}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleString("vi-VN") : "Never"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link href={`/${locale}/admin/crm/user/${u.id}`}
                      className="text-xs text-brand hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-surface border border-border rounded text-sm text-white disabled:opacity-40 hover:bg-white/10">
              ← Prev
            </button>
            <span className="text-sm text-muted">Page {page} / {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-surface border border-border rounded text-sm text-white disabled:opacity-40 hover:bg-white/10">
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
