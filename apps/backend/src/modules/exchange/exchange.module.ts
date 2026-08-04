import { Module }          from "@nestjs/common";
import { ExchangeService } from "./exchange.service";
import { OrderService }    from "./order.service";
import { ExchangeController } from "./exchange.controller";
import { CcxtProvider }    from "./ccxt.provider";
import { WalletModule }    from "../wallet/wallet.module";

@Module({
  imports:     [WalletModule],
  providers:   [ExchangeService, OrderService, CcxtProvider],
  controllers: [ExchangeController],
  exports:     [ExchangeService, OrderService, CcxtProvider],
})
export class ExchangeModule {}
