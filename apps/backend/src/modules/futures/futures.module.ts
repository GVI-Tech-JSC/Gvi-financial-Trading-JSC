import { Module }             from "@nestjs/common";
import { FuturesService }     from "./futures.service";
import { FuturesController }  from "./futures.controller";
import { LiquidationEngine }  from "./engines/liquidation.engine";
import { FundingRateEngine }  from "./engines/funding-rate.engine";
import { WalletModule }       from "../wallet/wallet.module";

@Module({
  imports:     [WalletModule],
  providers:   [FuturesService, LiquidationEngine, FundingRateEngine],
  controllers: [FuturesController],
  exports:     [FuturesService],
})
export class FuturesModule {}
