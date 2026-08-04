"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

interface ProfileData {
  id: string; email: string; firstName: string; lastName: string;
  phone?: string; avatar?: string; kycLevel: number;
  twoFactorEnabled: boolean; createdAt: string; referralCode?: string;
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ firstName:"", lastName:"", phone:"" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/user/profile")
      .then(r => {
        const d = r.data?.data ?? null;
        setProfile(d);
        if (d) setForm({ firstName: d.firstName ?? "", lastName: d.lastName ?? "", phone: d.phone ?? "" });
      })
      .catch(() => {});
  }, []);

  async function save() {
    setLoading(true); setMsg("");
    try {
      await api.patch("/user/profile", form);
      setMsg("Profile updated!");
    } catch (e: any) { setMsg(e?.response?.data?.message ?? "Error"); }
    finally { setLoading(false); }
  }

  const kycLabels = ["Unverified","Basic","Advanced","Institution"];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>

        {/* Avatar + meta */}
        {profile && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 mb-6 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-2xl font-bold text-[#3b82f6]">
              {profile.firstName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <div className="text-xl font-semibold">{profile.firstName} {profile.lastName}</div>
              <div className="text-sm text-[#8b949e]">{profile.email}</div>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${profile.kycLevel > 0 ? "bg-green-900/40 text-green-400" : "bg-[#21262d] text-[#8b949e]"}`}>
                  KYC {kycLabels[profile.kycLevel ?? 0]}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${profile.twoFactorEnabled ? "bg-green-900/40 text-green-400" : "bg-yellow-900/40 text-yellow-400"}`}>
                  2FA {profile.twoFactorEnabled ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>
        )}

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes("!") ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-red-900/40 text-red-400 border border-red-800"}`}>
            {msg}
          </div>
        )}

        {/* Edit form */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          <h2 className="text-base font-semibold mb-4">Edit Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label:"First Name", key:"firstName" },
              { label:"Last Name",  key:"lastName" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-[#8b949e] mb-1 block">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#3b82f6]" />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-xs text-[#8b949e] mb-1 block">Phone</label>
              <input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))}
                placeholder="+84xxxxxxxxx"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm placeholder-[#484f58] focus:outline-none focus:border-[#3b82f6]" />
            </div>
          </div>
          <button onClick={save} disabled={loading}
            className="mt-4 px-6 py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] font-semibold text-sm disabled:opacity-50">
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {profile?.referralCode && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mt-4">
            <div className="text-sm text-[#8b949e] mb-1">Your Referral Code</div>
            <div className="text-xl font-mono font-bold text-[#3b82f6]">{profile.referralCode}</div>
          </div>
        )}
      </div>
    </div>
  );
}
