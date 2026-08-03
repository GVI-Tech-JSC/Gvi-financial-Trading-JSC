import { Module } from "@nestjs/common";
import { BinaryService }    from "./binary.service";
import { BinaryController } from "./binary.controller";

@Module({
  providers:   [BinaryService],
  controllers: [BinaryController],
  exports:     [BinaryService],
})
export class BinaryModule {}
