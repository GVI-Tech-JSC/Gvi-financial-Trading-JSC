"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  totalCommission: number;
  pendingCommission: number;
  tree: ReferralNode[];
}
interface ReferralNode {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level: number;
  joinedAt: string;
  commissionEarned: number;
}

export default function AffiliatePage() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/affiliate/stats").then(r => setStats(r.data?.data ?? null)).catch(() => {});
  }, []);

  function copy() {
    if (!stats) return;
    const url = `${window.location.origin}/register?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function applyReferral() {
    if (!applyCode.trim()) return;
    try {
      await api.post("/affiliate/apply", { referralCode: applyCode.trim() });
      setMsg("Referral code applied!");
    } catch (e: any) { setMsg(e?.response?.data?.message ?? "Error"); }
  }

  const TIERS = [
    { level: 1, rate: "5%", desc: "Direct referrals" },
    { level: 2, rate: "2%", desc: "Level 2 network" },
    { level: 3, rate: "1%", desc: "Level 3 network" },
    { level: 4, rate: "0.5%", desc: "Level 4 network" },
    { level: 5, rate: "0.25%", desc: "Level 5 network" },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Affiliate Program</h1>
          <p className="text-[#8b949e] mt-1">Earn up to 5-level MLM commissions on every trade</p>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes("!") ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-red-900/40 text-red-400 border border-red-800"}`}>
            {msg}
          </div>
        )}

        {/* Stats grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Your Code", value: stats.referralCode, mono: true },
              { label: "Total Referrals", value: stats.totalReferrals },
              { label: "Total Commission", value: `$${stats.totalCommission.toFixed(2)}` },
              { label: "Pending", value: `$${stats.pendingCommission.toFixed(2)}` },
            ].map(s => (
              <div key={s.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
                <div className="text-[#8b949e] text-xs mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.mono ? "font-mono tracking-widest text-[#3b82f6]" : ""}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Referral link */}
        {stats && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-6">
            <h2 className="text-base font-semibold mb-3">Your Referral Link</h2>
            <div className="flex gap-3">
              <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-sm font-mono text-[#8b949e] truncate">
                {typeof window !== "undefined" ? `${window.location.origin}/register?ref=${stats.referralCode}` : `https://vnkr.vn/register?ref=${stats.referralCode}`}
              </div>
              <button onClick={copy} className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${copied ? "bg-green-600" : "bg-[#3b82f6] hover:bg-[#2563eb]"}`}>
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Commission tiers */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <h2 className="text-base font-semibold mb-4">Commission Tiers</h2>
            <div className="space-y-3">
              {TIERS.map(tier => (
                <div key={tier.level} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#3b82f6]/20 text-[#3b82f6] flex items-center justify-center text-sm font-bold">
                    {tier.level}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{tier.desc}</div>
                    <div className="text-xs text-[#8b949e]">On trading fees</div>
                  </div>
                  <div className="text-green-400 font-bold">{tier.rate}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Apply referral + Network */}
          <div className="space-y-4">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <h2 className="text-base font-semibold mb-3">Apply Referral Code</h2>
              <div className="flex gap-2">
                <input value={applyCode} onChange={e => setApplyCode(e.target.value)}
                  placeholder="Enter referral code"
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm placeholder-[#484f58] focus:outline-none focus:border-[#3b82f6]" />
                <button onClick={applyReferral} className="px-4 py-2 bg-[#3b82f6] hover:bg-[#2563eb] rounded-lg text-sm font-semibold">Apply</button>
              </div>
            </div>

            {/* Referral tree */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <h2 className="text-base font-semibold mb-3">My Network</h2>
              {(!stats || !stats.tree?.length) ? (
                <div className="text-center text-[#8b949e] py-4 text-sm">No referrals yet — share your link!</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stats.tree.map(node => (
                    <div key={node.id} className="flex items-center gap-3 text-sm" style={{ paddingLeft: `${(node.level - 1) * 16}px` }}>
                      <div className="w-6 h-6 rounded-full bg-[#21262d] flex items-center justify-center text-xs text-[#8b949e]">
                        {node.firstName?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{node.firstName} {node.lastName}</span>
                        <span className="text-[#8b949e] ml-2 text-xs">Lv{node.level}</span>
                      </div>
                      <span className="text-green-400 text-xs">+${node.commissionEarned?.toFixed(2) ?? "0.00"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
