import { Module } from "@nestjs/common";
import { TradeGateway } from "./websocket.gateway";

@Module({ providers: [TradeGateway], exports: [TradeGateway] })
export class WebsocketModule {}
