/**
 * VNKR Trade — API Client
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import axios, { AxiosInstance } from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Exchange API helpers ──────────────────────────────────────
export const exchangeApi = {
  getMarkets:   ()                    => api.get("/api/exchange/market"),
  getTicker:    (symbol: string)      => api.get("/api/exchange/ticker", { params: { symbol } }),
  getTickers:   (symbols?: string[])  => api.get("/api/exchange/ticker", { params: { symbols: symbols?.join(",") } }),
  getCandles:   (symbol: string, timeframe = "1h", limit = 200) =>
    api.get("/api/exchange/chart", { params: { symbol, timeframe, limit } }),
  getOrderBook: (symbol: string, limit = 20) =>
    api.get("/api/exchange/orderbook", { params: { symbol, limit } }),
  getTrades:    (symbol: string, limit = 50) =>
    api.get("/api/exchange/trades", { params: { symbol, limit } }),
  createOrder:  (data: any)           => api.post("/api/exchange/order", data),
  cancelOrder:  (id: string)          => api.delete(`/api/exchange/order/${id}`),
  getOrders:    (params?: any)        => api.get("/api/exchange/order", { params }),
  getOpenOrders:()                    => api.get("/api/exchange/order/open"),
};

export const walletApi = {
  getWallets:     ()                  => api.get("/api/finance/wallet"),
  getStats:       ()                  => api.get("/api/finance/wallet/stats"),
  transfer:       (data: any)         => api.post("/api/finance/transfer", data),
  getTransactions:(params?: any)      => api.get("/api/finance/transaction", { params }),
  depositSpot:    (data: any)         => api.post("/api/finance/deposit/spot", data),
  withdrawSpot:   (data: any)         => api.post("/api/finance/withdraw/spot", data),
};

export const authApi = {
  login:    (data: any) => api.post("/api/auth/login", data),
  register: (data: any) => api.post("/api/auth/register", data),
  session:  ()          => api.get("/api/auth/session"),
  logout:   ()          => api.post("/api/auth/logout"),
};
