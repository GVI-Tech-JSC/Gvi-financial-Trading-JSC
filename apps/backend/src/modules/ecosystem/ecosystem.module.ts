import { Module } from "@nestjs/common";
import { EcosystemService }    from "./ecosystem.service";
import { EcosystemController } from "./ecosystem.controller";

@Module({
  providers:   [EcosystemService],
  controllers: [EcosystemController],
  exports:     [EcosystemService],
})
export class EcosystemModule {}
