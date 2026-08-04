import { Module }     from "@nestjs/common";
import { P2pService } from "./p2p.service";
import { P2pController } from "./p2p.controller";
import { WalletModule }  from "../wallet/wallet.module";

@Module({
  imports:     [WalletModule],
  providers:   [P2pService],
  controllers: [P2pController],
  exports:     [P2pService],
})
export class P2pModule {}
