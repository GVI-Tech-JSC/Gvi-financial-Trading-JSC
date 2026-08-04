import { IsString, IsEnum, IsNumber, IsInt, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum BinarySide { RISE = "RISE", FALL = "FALL" }

export class PlaceBinaryOrderDto {
  @ApiProperty({ example: "BTC/USDT" })  @IsString()              symbol:     string;
  @ApiProperty({ enum: BinarySide })     @IsEnum(BinarySide)       side:       BinarySide;
  @ApiProperty({ example: 50 })          @IsNumber() @Min(1)       amount:     number;
  @ApiProperty({ example: 60 })          @IsInt() @Min(30)         duration:   number; // seconds
}
