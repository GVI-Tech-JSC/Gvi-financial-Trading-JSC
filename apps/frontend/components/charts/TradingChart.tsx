"use client";
/**
 * VNKR Trade — TradingChart
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Uses TradingView Lightweight Charts (Apache-2.0)
 */
import { useEffect, useRef, useState } from "react";
import {
  createChart, IChartApi, ISeriesApi,
  CandlestickSeries, ColorType, CrosshairMode,
} from "lightweight-charts";
import { exchangeApi } from "@/lib/api";

const TIMEFRAMES = ["1m","5m","15m","1h","4h","1d","1w"];

interface Props { symbol: string; }

export default function TradingChart({ symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [tf, setTf]  = useState("1h");
  const [loading, setLoading] = useState(true);

  // Init chart once
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background:  { type: ColorType.Solid, color: "#0f172a" },
        textColor:   "#94a3b8",
      },
      grid: {
        vertLines:   { color: "#1e293b" },
        horzLines:   { color: "#1e293b" },
      },
      crosshair:     { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#334155" },
      timeScale:     { borderColor: "#334155", timeVisible: true },
      width:  containerRef.current.clientWidth,
      height: 420,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor:          "#16a34a",
      downColor:        "#dc2626",
      borderUpColor:    "#16a34a",
      borderDownColor:  "#dc2626",
      wickUpColor:      "#16a34a",
      wickDownColor:    "#dc2626",
    });
    chartRef.current  = chart;
    seriesRef.current = series;

    const handleResize = () =>
      chart.applyOptions({ width: containerRef.current!.clientWidth });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Load candles when symbol/tf changes
  useEffect(() => {
    if (!seriesRef.current) return;
    setLoading(true);
    exchangeApi.getCandles(symbol, tf, 300)
      .then(({ data }) => {
        seriesRef.current!.setData(
          data.map((c: any) => ({
            time:  c.time,
            open:  c.open,
            high:  c.high,
            low:   c.low,
            close: c.close,
          }))
        );
        chartRef.current!.timeScale().fitContent();
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbol, tf]);

  return (
    <div className="bg-surface rounded-lg overflow-hidden border border-border">
      {/* Timeframe selector */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border">
        {TIMEFRAMES.map(t => (
          <button
            key={t}
            onClick={() => setTf(t)}
            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
              tf === t
                ? "bg-brand text-white"
                : "text-muted hover:text-white hover:bg-white/5"
            }`}
          >
            {t}
          </button>
        ))}
        {loading && <span className="ml-auto text-xs text-muted">Loading...</span>}
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
