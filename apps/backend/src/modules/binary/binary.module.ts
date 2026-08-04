import { Module }          from "@nestjs/common";
import { BinaryService }   from "./binary.service";
import { BinaryController }from "./binary.controller";
import { BinaryEngine }    from "./engines/binary.engine";
import { WalletModule }    from "../wallet/wallet.module";

@Module({
  imports:     [WalletModule],
  providers:   [BinaryService, BinaryEngine],
  controllers: [BinaryController],
  exports:     [BinaryService],
})
export class BinaryModule {}
