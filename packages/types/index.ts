/**
 * VNKR Trade — Shared TypeScript Types
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?:   T;
  message?: string;
  error?:   string;
}

export interface PaginatedResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  pageSize:   number;
  totalPages: number;
}

export interface JwtPayload {
  sub:   string;
  email: string;
  role:  string;
  iat?:  number;
  exp?:  number;
}

export type OrderSide    = "BUY" | "SELL";
export type OrderType    = "MARKET" | "LIMIT" | "STOP_LIMIT";
export type OrderStatus  = "OPEN" | "CLOSED" | "CANCELED" | "EXPIRED" | "REJECTED";
export type WalletType   = "FIAT" | "SPOT" | "ECO" | "FUTURES" | "COPY_TRADING";
export type UserStatus   = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
export type KycStatus    = "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED";
export type TxStatus     = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface Ticker {
  symbol:    string;
  last:      number;
  bid:       number;
  ask:       number;
  high:      number;
  low:       number;
  volume:    number;
  change:    number;
  changePct: number;
  timestamp: number;
}

export interface OHLCV {
  time:   number;
  open:   number;
  high:   number;
  low:    number;
  close:  number;
  volume: number;
}

export interface OrderBookEntry { price: number; amount: number; }
export interface OrderBook {
  symbol: string;
  bids:   OrderBookEntry[];
  asks:   OrderBookEntry[];
  ts:     number;
}
