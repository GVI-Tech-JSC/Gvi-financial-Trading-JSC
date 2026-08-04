import { Module }              from "@nestjs/common";
import { EcosystemService }    from "./ecosystem.service";
import { EcosystemController } from "./ecosystem.controller";
import { HdWalletService }     from "./services/hd-wallet.service";
import { DepositMonitorService }from "./services/deposit-monitor.service";

@Module({
  providers:   [EcosystemService, HdWalletService, DepositMonitorService],
  controllers: [EcosystemController],
  exports:     [EcosystemService, HdWalletService],
})
export class EcosystemModule {}
