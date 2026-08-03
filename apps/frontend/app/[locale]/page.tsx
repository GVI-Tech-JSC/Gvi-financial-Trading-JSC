import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-white">VNKR Trade</h1>
      <p className="text-muted">Nền tảng giao dịch tài chính — GVI Tech JSC</p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/vi/trade"    className="px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:opacity-90">Spot Trading</Link>
        <Link href="/vi/futures"  className="px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:opacity-90">Futures</Link>
        <Link href="/vi/binary"   className="px-6 py-3 bg-brand text-white rounded-lg font-semibold hover:opacity-90">Binary</Link>
        <Link href="/vi/login"    className="px-6 py-3 border border-brand text-brand rounded-lg font-semibold hover:bg-brand hover:text-white">Đăng nhập</Link>
      </div>
    </main>
  );
}
