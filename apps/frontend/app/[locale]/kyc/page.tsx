"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";

type KycStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";
interface KycState { status: KycStatus; level: number; rejectionReason?: string; submittedAt?: string; }

const STEPS = [
  { level: 0, label: "Unverified",  desc: "No limits set" },
  { level: 1, label: "Basic KYC",   desc: "10M VND / day" },
  { level: 2, label: "Advanced",    desc: "100M VND / day" },
  { level: 3, label: "Institution", desc: "Unlimited" },
];

export default function KycPage() {
  const [kyc, setKyc]     = useState<KycState>({ status: "NONE", level: 0 });
  const [form, setForm]   = useState({ fullName:"", idType:"CCCD", idNumber:"", dob:"", nationality:"VN", address:"" });
  const [msg, setMsg]     = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get("/kyc/status").then(r => setKyc(r.data?.data ?? { status:"NONE", level:0 })).catch(() => {});
  }, []);

  async function submit() {
    setLoading(true); setMsg("");
    try {
      await api.post("/kyc/submit", form);
      setMsg("KYC submitted! Under review within 24h.");
      setKyc({ status:"PENDING", level: kyc.level });
    } catch (e: any) { setMsg(e?.response?.data?.message ?? "Error"); }
    finally { setLoading(false); }
  }

  const statusColor: Record<KycStatus,string> = {
    NONE:"text-[#8b949e]", PENDING:"text-yellow-400", APPROVED:"text-green-400", REJECTED:"text-red-400"
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Identity Verification</h1>
          <p className="text-[#8b949e] mt-1">Complete KYC to unlock higher trading limits</p>
        </div>

        {/* Level progress */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {STEPS.map(s => (
            <div key={s.level} className={`bg-[#161b22] border rounded-xl p-4 text-center ${kyc.level >= s.level ? "border-[#3b82f6]" : "border-[#30363d]"}`}>
              <div className={`text-2xl font-bold mb-1 ${kyc.level >= s.level ? "text-[#3b82f6]" : "text-[#484f58]"}`}>L{s.level}</div>
              <div className="text-xs font-semibold">{s.label}</div>
              <div className="text-xs text-[#8b949e] mt-0.5">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* Current status */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#8b949e]">Current Level</div>
              <div className="text-xl font-bold">Level {kyc.level} — {STEPS[kyc.level]?.label}</div>
            </div>
            <div className={`text-sm font-semibold px-3 py-1 rounded-full bg-[#21262d] ${statusColor[kyc.status]}`}>
              {kyc.status}
            </div>
          </div>
          {kyc.status === "REJECTED" && kyc.rejectionReason && (
            <div className="mt-3 text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
              Rejection reason: {kyc.rejectionReason}
            </div>
          )}
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${msg.includes("submitted") ? "bg-green-900/40 text-green-400 border border-green-800" : "bg-red-900/40 text-red-400 border border-red-800"}`}>
            {msg}
          </div>
        )}

        {/* Form */}
        {(kyc.status === "NONE" || kyc.status === "REJECTED") && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4">Submit Verification</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label:"Full Name", key:"fullName", type:"text", placeholder:"NGUYEN VAN A" },
                { label:"Date of Birth", key:"dob", type:"date", placeholder:"" },
                { label:"Nationality", key:"nationality", type:"text", placeholder:"VN" },
                { label:"Address", key:"address", type:"text", placeholder:"123 Nguyen Hue, Q1, TP.HCM" },
                { label:"ID Number", key:"idNumber", type:"text", placeholder:"001099001234" },
              ].map(f => (
                <div key={f.key} className={f.key==="address" ? "sm:col-span-2" : ""}>
                  <label className="text-xs text-[#8b949e] mb-1 block">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} placeholder={f.placeholder}
                    onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm placeholder-[#484f58] focus:outline-none focus:border-[#3b82f6]" />
                </div>
              ))}
              <div>
                <label className="text-xs text-[#8b949e] mb-1 block">ID Type</label>
                <select value={form.idType} onChange={e => setForm(p=>({...p,idType:e.target.value}))}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm">
                  <option value="CCCD">CCCD (Căn cước công dân)</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVER_LICENSE">Driver License</option>
                </select>
              </div>
            </div>
            <div className="mt-4 p-3 bg-[#0d1117] rounded-lg text-xs text-[#8b949e]">
              Theo quy định tại NĐ-13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, thông tin của bạn sẽ được mã hóa và chỉ dùng cho mục đích xác minh danh tính.
            </div>
            <button onClick={submit} disabled={loading}
              className="mt-5 w-full py-3 rounded-lg font-semibold bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 transition-colors">
              {loading ? "Submitting…" : "Submit for Review"}
            </button>
          </div>
        )}

        {kyc.status === "PENDING" && (
          <div className="bg-[#161b22] border border-yellow-800 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">⏳</div>
            <div className="font-semibold">Verification in progress</div>
            <div className="text-sm text-[#8b949e] mt-1">Our team reviews within 24 hours. You will receive a notification.</div>
          </div>
        )}

        {kyc.status === "APPROVED" && (
          <div className="bg-[#161b22] border border-green-800 rounded-xl p-8 text-center">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-semibold text-green-400">Verified — Level {kyc.level}</div>
            <div className="text-sm text-[#8b949e] mt-1">Your identity has been verified. Enjoy higher limits.</div>
          </div>
        )}
      </div>
    </div>
  );
}
