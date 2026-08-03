import {
  WebSocketGateway, WebSocketServer,
  SubscribeMessage, MessageBody, ConnectedSocket,
  OnGatewayConnection, OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/" })
export class TradeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger("WebSocket");

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage("subscribe:ticker")
  handleTickerSubscribe(@MessageBody() symbol: string, @ConnectedSocket() client: Socket) {
    client.join(`ticker:${symbol}`);
    return { event: "subscribed", data: `ticker:${symbol}` };
  }

  @SubscribeMessage("subscribe:orderbook")
  handleOrderbookSubscribe(@MessageBody() symbol: string, @ConnectedSocket() client: Socket) {
    client.join(`orderbook:${symbol}`);
    return { event: "subscribed", data: `orderbook:${symbol}` };
  }

  @SubscribeMessage("subscribe:trades")
  handleTradesSubscribe(@MessageBody() symbol: string, @ConnectedSocket() client: Socket) {
    client.join(`trades:${symbol}`);
    return { event: "subscribed", data: `trades:${symbol}` };
  }

  broadcastTicker(symbol: string, data: any) {
    this.server.to(`ticker:${symbol}`).emit("ticker", data);
  }
  broadcastOrderbook(symbol: string, data: any) {
    this.server.to(`orderbook:${symbol}`).emit("orderbook", data);
  }
  broadcastOrderUpdate(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit("order:update", data);
  }
}
