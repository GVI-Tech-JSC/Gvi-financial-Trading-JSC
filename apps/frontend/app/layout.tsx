import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VNKR Trade — GVI Tech JSC",
  description: "Nền tảng giao dịch tài chính | Author: NGUYEN THI THU HUONG",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
