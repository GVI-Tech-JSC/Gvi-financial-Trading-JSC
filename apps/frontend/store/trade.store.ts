"use client";
/**
 * VNKR Trade — Trading Store (Zustand)
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { create } from "zustand";

export interface Ticker {
  symbol: string; last: number; bid: number; ask: number;
  high: number; low: number; volume: number;
  change: number; changePct: number;
}

export interface OrderBookLevel { price: number; amount: number; }
export interface OrderBook {
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  ts: number;
}

interface TradeState {
  symbol:     string;
  ticker:     Ticker | null;
  orderBook:  OrderBook | null;
  orders:     any[];
  markets:    any[];
  setSymbol:  (s: string) => void;
  setTicker:  (t: Ticker) => void;
  setOrderBook:(ob: OrderBook) => void;
  setOrders:  (orders: any[]) => void;
  setMarkets: (markets: any[]) => void;
  addOrder:   (order: any) => void;
  removeOrder:(id: string) => void;
}

export const useTradeStore = create<TradeState>((set) => ({
  symbol:     "BTC/USDT",
  ticker:     null,
  orderBook:  null,
  orders:     [],
  markets:    [],
  setSymbol:  (symbol)   => set({ symbol }),
  setTicker:  (ticker)   => set({ ticker }),
  setOrderBook:(orderBook) => set({ orderBook }),
  setOrders:  (orders)   => set({ orders }),
  setMarkets: (markets)  => set({ markets }),
  addOrder:   (order)    => set((s) => ({ orders: [order, ...s.orders] })),
  removeOrder:(id)       => set((s) => ({ orders: s.orders.filter(o => o.id !== id) })),
}));
