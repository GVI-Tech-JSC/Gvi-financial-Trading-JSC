import { Module }          from "@nestjs/common";
import { StakingService }  from "./staking.service";
import { StakingController }from "./staking.controller";
import { RewardEngine }    from "./engines/reward.engine";
import { WalletModule }    from "../wallet/wallet.module";

@Module({
  imports:     [WalletModule],
  providers:   [StakingService, RewardEngine],
  controllers: [StakingController],
  exports:     [StakingService],
})
export class StakingModule {}
