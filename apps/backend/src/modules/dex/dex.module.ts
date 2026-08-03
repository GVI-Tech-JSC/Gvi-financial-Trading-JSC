import { Module } from "@nestjs/common";
import { DexService }    from "./dex.service";
import { DexController } from "./dex.controller";

@Module({
  providers:   [DexService],
  controllers: [DexController],
  exports:     [DexService],
})
export class DexModule {}
