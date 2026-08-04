"use client";
/**
 * VNKR Trade — Login Page
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export default function LoginPage() {
  const router  = useRouter();
  const params  = useParams();
  const locale  = params.locale as string;
  const setAuth = useAuthStore(s => s.setAuth);

  const [form,    setForm]    = useState({ email: "", password: "", otpCode: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [needs2fa,setNeeds2fa]= useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await authApi.login(form);
      if (data.requiresTwoFactor) { setNeeds2fa(true); setLoading(false); return; }
      setAuth(data, data.accessToken);
      router.push(`/${locale}/trade/BTC-USDT`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">VNKR Trade</h1>
          <p className="text-muted text-sm mt-1">GVI Tech JSC</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">
            {needs2fa ? "Two-Factor Auth" : "Sign In"}
          </h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!needs2fa ? (
              <>
                <div>
                  <label className="text-xs text-muted mb-1 block">Email</label>
                  <input type="email" required autoComplete="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-white placeholder-muted outline-none focus:border-brand"
                    placeholder="you@vnkr.vn"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted mb-1 block">Password</label>
                  <input type="password" required autoComplete="current-password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-white placeholder-muted outline-none focus:border-brand"
                    placeholder="••••••••"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="text-xs text-muted mb-1 block">OTP Code (2FA)</label>
                <input type="text" required maxLength={6} autoComplete="one-time-code"
                  value={form.otpCode}
                  onChange={e => setForm(f => ({ ...f, otpCode: e.target.value }))}
                  className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-white text-center tracking-widest font-mono outline-none focus:border-brand"
                  placeholder="000000"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-brand text-white rounded font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? "Signing in..." : needs2fa ? "Verify" : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-muted">
            No account?{" "}
            <Link href={`/${locale}/register`} className="text-brand hover:underline">Register</Link>
            <span className="mx-2">·</span>
            <Link href={`/${locale}/reset`} className="text-brand hover:underline">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
