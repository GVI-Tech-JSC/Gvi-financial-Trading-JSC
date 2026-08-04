"use client";
/**
 * VNKR Trade — useTradeSocket
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Connects to backend Socket.IO, manages subscriptions
 */
import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4001";

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(WS_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return sharedSocket;
}

export function useTickerSocket(
  symbol: string,
  onTicker: (data: any) => void
) {
  useEffect(() => {
    if (!symbol) return;
    const socket = getSocket();
    socket.emit("subscribe:ticker", symbol);
    socket.on("ticker", (data: any) => {
      if (data.symbol === symbol) onTicker(data);
    });
    return () => {
      socket.emit("unsubscribe:ticker", symbol);
      socket.off("ticker");
    };
  }, [symbol]);
}

export function useOrderBookSocket(
  symbol: string,
  onOrderBook: (data: any) => void
) {
  useEffect(() => {
    if (!symbol) return;
    const socket = getSocket();
    socket.emit("subscribe:orderbook", symbol);
    socket.on("orderbook", (data: any) => {
      if (data.symbol === symbol) onOrderBook(data);
    });
    return () => {
      socket.emit("unsubscribe:orderbook", symbol);
      socket.off("orderbook");
    };
  }, [symbol]);
}

export function useUserSocket(
  userId: string,
  handlers: { onOrder?: (d: any) => void; onBalance?: (d: any) => void }
) {
  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socket.emit("subscribe:user", userId);
    if (handlers.onOrder)   socket.on("order:update",   handlers.onOrder);
    if (handlers.onBalance) socket.on("balance:update", handlers.onBalance);
    return () => {
      socket.off("order:update");
      socket.off("balance:update");
    };
  }, [userId]);
}
