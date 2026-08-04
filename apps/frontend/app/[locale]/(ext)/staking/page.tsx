"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import api from "@/lib/api";

interface StakingPool {
  id: string;
  name: string;
  currency: string;
  apy: number;
  minAmount: number;
  lockDays: number;
  totalStaked: number;
  status: string;
}
interface UserStake {
  id: string;
  pool: StakingPool;
  amount: number;
  status: string;
  stakedAt: string;
  unlocksAt: string;
  accruedReward: number;
}

export default function StakingPage() {
  const t = useTranslations();
  const [pools, setPools] = useState<StakingPool[]>([]);
  const [stakes, setStakes] = useState<UserStake[]>([]);
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/staking/pools").then(r => setPools(r.data?.data ?? [])).catch(() => {});
    api.get("/staking/my").then(r => setStakes(r.data?.data ?? [])).catch(() => {});
  }, []);

  async function handleStake() {
    if (!selectedPool || !amount) return;
    setLoading(true); setMsg("");
    try {
      await api.post("/staking/stake", { poolId: selectedPool.id, amount: parseFloat(amount) });
      setMsg("Staked successfully!");
      setAmount(""); setSelectedPool(null);
      const r = await api.get("/staking/my");
      setStakes(r.data?.data ?? []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? "Error");
    } finally { setLoading(false); }
  }

  async function handleUnstake(stakeId: string) {
    setLoading(true); setMsg("");
    try {
      await api.post(`/staking/unstake/${stakeId}`);
      setMsg("Unstaked successfully!");
      const r = await api.get("/staking/my");
      setStakes(r.data?.data ?? []);
    } catch (e: any) {
      setMsg(e?.response?.data?.message ?? "Error");
    } finally { setLoading(false); }
  }

  const totalValue = stakes.reduce((s, x) => s + x.amount + x.accruedReward, 0);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Staking</h1>
          <p className="text-[#8b949e] mt-1">Stake VNKR & earn passive rewards daily</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Staked Value", value: `$${totalValue.toLocaleString(undefined,{maximumFractionDigits:2})}` },
            { label: "Active Stakes", value: stakes.filter(s=>s.status==="active").length },
            { label: "Available Pools", value: pools.length },
          ].map(s => (
            <div key={s.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <div className="text-[#8b949e] text-sm">{s.label}</div>
              <div className="text-2xl font-bold text-white mt-1">{s.value}</div>
            </div>
          ))}
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes("success") ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-red-900/40 text-red-400 border border-red-800"}`}>
            {msg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pools */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Available Pools</h2>
            <div className="space-y-3">
              {pools.length === 0 && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center text-[#8b949e]">No pools available</div>
              )}
              {pools.map(pool => (
                <div
                  key={pool.id}
                  onClick={() => setSelectedPool(pool)}
                  className={`bg-[#161b22] border rounded-xl p-4 cursor-pointer transition-all ${selectedPool?.id === pool.id ? "border-[#3b82f6]" : "border-[#30363d] hover:border-[#484f58]"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{pool.name}</span>
                    <span className="text-green-400 font-bold text-lg">{pool.apy}% APY</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm text-[#8b949e]">
                    <div><span className="block text-white">{pool.currency}</span>Currency</div>
                    <div><span className="block text-white">{pool.lockDays}d</span>Lock</div>
                    <div><span className="block text-white">{pool.minAmount}</span>Min</div>
                  </div>
                  {pool.status !== "active" && (
                    <div className="mt-2 text-xs text-yellow-400">{pool.status}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stake form + My Stakes */}
          <div className="space-y-6">
            {/* Form */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <h2 className="text-lg font-semibold mb-4">Stake Now</h2>
              {selectedPool ? (
                <>
                  <div className="bg-[#0d1117] rounded-lg p-3 mb-4 text-sm">
                    <div className="flex justify-between"><span className="text-[#8b949e]">Pool</span><span>{selectedPool.name}</span></div>
                    <div className="flex justify-between mt-1"><span className="text-[#8b949e]">APY</span><span className="text-green-400">{selectedPool.apy}%</span></div>
                    <div className="flex justify-between mt-1"><span className="text-[#8b949e]">Lock Period</span><span>{selectedPool.lockDays} days</span></div>
                  </div>
                  <input
                    type="number" placeholder={`Min ${selectedPool.minAmount} ${selectedPool.currency}`}
                    value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-white placeholder-[#484f58] focus:outline-none focus:border-[#3b82f6] mb-3"
                  />
                  <button onClick={handleStake} disabled={loading}
                    className="w-full py-2.5 rounded-lg font-semibold bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 transition-colors">
                    {loading ? "Processing…" : "Confirm Stake"}
                  </button>
                  <button onClick={() => setSelectedPool(null)} className="w-full mt-2 py-2 text-sm text-[#8b949e] hover:text-white">Cancel</button>
                </>
              ) : (
                <div className="text-center text-[#8b949e] py-6">← Select a pool to stake</div>
              )}
            </div>

            {/* My Stakes */}
            <div>
              <h2 className="text-lg font-semibold mb-3">My Stakes</h2>
              {stakes.length === 0 && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 text-center text-[#8b949e]">No active stakes</div>
              )}
              {stakes.map(st => (
                <div key={st.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{st.pool?.name ?? "Pool"}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${st.status === "active" ? "bg-green-900/40 text-green-400" : "bg-yellow-900/40 text-yellow-400"}`}>{st.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div><span className="text-[#8b949e]">Staked</span><div className="font-semibold">{st.amount}</div></div>
                    <div><span className="text-[#8b949e]">Reward</span><div className="font-semibold text-green-400">+{st.accruedReward?.toFixed(4) ?? 0}</div></div>
                    <div><span className="text-[#8b949e]">Unlocks</span><div className="text-xs">{new Date(st.unlocksAt).toLocaleDateString()}</div></div>
                  </div>
                  <button onClick={() => handleUnstake(st.id)} disabled={loading}
                    className="w-full py-1.5 rounded-lg text-sm border border-[#30363d] hover:border-red-500 hover:text-red-400 transition-colors">
                    Unstake
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
