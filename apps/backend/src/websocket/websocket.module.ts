import { Module }                  from "@nestjs/common";
import { TradeGateway }            from "./websocket.gateway";
import { TickerBroadcastService }  from "./ticker-broadcast.service";
import { ExchangeModule }          from "../modules/exchange/exchange.module";

@Module({
  imports:   [ExchangeModule],
  providers: [TradeGateway, TickerBroadcastService],
  exports:   [TradeGateway, TickerBroadcastService],
})
export class WebsocketModule {}
