"use client";
/**
 * VNKR Trade — Register Page
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth.store";

export default function RegisterPage() {
  const router  = useRouter();
  const params  = useParams();
  const locale  = params.locale as string;
  const setAuth = useAuthStore(s => s.setAuth);

  const [form, setForm] = useState({
    email: "", password: "", confirmPassword: "", firstName: "", lastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match"); return;
    }
    setLoading(true); setError("");
    try {
      const { data } = await authApi.register({
        email: form.email, password: form.password,
        firstName: form.firstName, lastName: form.lastName,
      });
      setAuth(data, data.accessToken);
      router.push(`/${locale}/trade/BTC-USDT`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  const field = (key: keyof typeof form, label: string, type = "text", placeholder = "") => (
    <div>
      <label className="text-xs text-muted mb-1 block">{label}</label>
      <input type={type} required={key !== "firstName" && key !== "lastName"}
        value={form[key]} placeholder={placeholder}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-white placeholder-muted outline-none focus:border-brand"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">VNKR Trade</h1>
          <p className="text-muted text-sm mt-1">GVI Tech JSC</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Create Account</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              {field("firstName", "First Name", "text", "Nguyen")}
              {field("lastName",  "Last Name",  "text", "Van A")}
            </div>
            {field("email",           "Email",            "email",    "you@vnkr.vn")}
            {field("password",        "Password",         "password", "Min 8 characters")}
            {field("confirmPassword", "Confirm Password", "password", "Repeat password")}

            {error && <p className="text-red-400 text-xs text-center">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-brand text-white rounded font-semibold text-sm hover:opacity-90 disabled:opacity-50">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted">
            Already have an account?{" "}
            <Link href={`/${locale}/login`} className="text-brand hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
