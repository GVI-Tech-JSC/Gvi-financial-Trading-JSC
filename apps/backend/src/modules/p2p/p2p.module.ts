import { Module } from "@nestjs/common";
import { P2pService }    from "./p2p.service";
import { P2pController } from "./p2p.controller";

@Module({
  providers:   [P2pService],
  controllers: [P2pController],
  exports:     [P2pService],
})
export class P2pModule {}
