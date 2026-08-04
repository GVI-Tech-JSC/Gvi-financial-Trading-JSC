/**
 * VNKR Trade — WebSocket Gateway
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection, OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger }         from "@nestjs/common";

@WebSocketGateway({
  cors: { origin: "*", credentials: true },
  transports: ["websocket", "polling"],
})
export class TradeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger("WsGateway");

  // Track which symbols have orderbook subscribers
  private orderbookRooms = new Set<string>();

  handleConnection(client: Socket) {
    this.logger.debug(`WS connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    this.logger.debug(`WS disconnected: ${client.id}`);
  }

  // ── Subscribe: ticker ────────────────────────────────────────
  @SubscribeMessage("subscribe:ticker")
  handleTickerSub(@MessageBody() symbol: string, @ConnectedSocket() client: Socket) {
    client.join(`ticker:${symbol}`);
    return { event: "subscribed", data: `ticker:${symbol}` };
  }

  @SubscribeMessage("unsubscribe:ticker")
  handleTickerUnsub(@MessageBody() symbol: string, @ConnectedSocket() client: Socket) {
    client.leave(`ticker:${symbol}`);
    return { event: "unsubscribed", data: `ticker:${symbol}` };
  }

  // ── Subscribe: orderbook ─────────────────────────────────────
  @SubscribeMessage("subscribe:orderbook")
  handleOrderbookSub(@MessageBody() symbol: string, @ConnectedSocket() client: Socket) {
    client.join(`orderbook:${symbol}`);
    this.orderbookRooms.add(symbol);
    return { event: "subscribed", data: `orderbook:${symbol}` };
  }

  @SubscribeMessage("unsubscribe:orderbook")
  handleOrderbookUnsub(@MessageBody() symbol: string, @ConnectedSocket() client: Socket) {
    client.leave(`orderbook:${symbol}`);
    return { event: "unsubscribed", data: `orderbook:${symbol}` };
  }

  // ── Subscribe: trades ────────────────────────────────────────
  @SubscribeMessage("subscribe:trades")
  handleTradesSub(@MessageBody() symbol: string, @ConnectedSocket() client: Socket) {
    client.join(`trades:${symbol}`);
    return { event: "subscribed", data: `trades:${symbol}` };
  }

  // ── Subscribe: user feed (orders, balance updates) ───────────
  @SubscribeMessage("subscribe:user")
  handleUserSub(@MessageBody() userId: string, @ConnectedSocket() client: Socket) {
    client.join(`user:${userId}`);
    return { event: "subscribed", data: `user:${userId}` };
  }

  // ── Broadcast helpers (called by TickerBroadcastService) ──────
  broadcastTicker(symbol: string, data: any) {
    this.server.to(`ticker:${symbol}`).emit("ticker", data);
  }
  broadcastOrderbook(symbol: string, data: any) {
    this.server.to(`orderbook:${symbol}`).emit("orderbook", data);
  }
  broadcastTrade(symbol: string, data: any) {
    this.server.to(`trades:${symbol}`).emit("trade", data);
  }
  broadcastOrderUpdate(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit("order:update", data);
  }
  broadcastBalanceUpdate(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit("balance:update", data);
  }

  getActiveOrderbookRooms(): string[] { return [...this.orderbookRooms]; }
}
