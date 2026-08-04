import { redirect } from "next/navigation";
export default function TradeIndex({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/trade/BTC-USDT`);
}
