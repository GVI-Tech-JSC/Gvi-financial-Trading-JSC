"use client";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";

const NAV_ITEMS = [
  { href: "/market",            label: "Markets" },
  { href: "/trade/BTC-USDT",   label: "Trade" },
  { href: "/(trading)/futures", label: "Futures" },
  { href: "/(trading)/binary",  label: "Binary" },
  { href: "/(ext)/p2p",         label: "P2P" },
  { href: "/(ext)/staking",     label: "Staking" },
  { href: "/(ext)/affiliate",   label: "Affiliate" },
  { href: "/blog",              label: "Blog" },
  { href: "/learn",             label: "Learn" },
];

export default function MainNav() {
  const params   = useParams();
  const pathname = usePathname();
  const locale   = (params?.locale as string) ?? "vi";
  const { user, logout } = useAuthStore();

  return (
    <nav className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={`/${locale}`} className="font-bold text-lg text-white flex items-center gap-2">
          <span className="text-[#3b82f6]">GVI</span>
          <span className="text-[#8b949e] font-normal text-sm hidden sm:block">Trade</span>
        </Link>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map(item => {
            const href = `/${locale}${item.href}`;
            const active = pathname.includes(item.href.replace(/\(.*?\)\//,"").split("/")[1] ?? "");
            return (
              <Link key={item.href} href={href}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${active ? "bg-[#21262d] text-white" : "text-[#8b949e] hover:text-white hover:bg-[#21262d]"}`}>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: auth */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={`/${locale}/finance/wallet`}
                className="text-sm text-[#8b949e] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#21262d]">
                Wallet
              </Link>
              <Link href={`/${locale}/(profile)/profile`}
                className="text-sm text-[#8b949e] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#21262d]">
                {user.firstName ?? "Account"}
              </Link>
              <button onClick={logout}
                className="text-sm text-[#8b949e] hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-[#21262d]">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/(auth)/login`}
                className="text-sm text-[#8b949e] hover:text-white px-3 py-1.5 rounded-lg hover:bg-[#21262d]">
                Login
              </Link>
              <Link href={`/${locale}/(auth)/register`}
                className="text-sm font-semibold bg-[#3b82f6] hover:bg-[#2563eb] px-4 py-1.5 rounded-lg transition-colors">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
