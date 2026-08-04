import { IsString, IsEnum, IsNumber, IsInt, Min, Max, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum FuturesSideDto { LONG = "LONG", SHORT = "SHORT" }
export enum FuturesOrderType { MARKET = "MARKET", LIMIT = "LIMIT" }

export class OpenPositionDto {
  @ApiProperty({ example: "BTCUSDT" })       @IsString()                    symbol:   string;
  @ApiProperty({ enum: FuturesSideDto })      @IsEnum(FuturesSideDto)        side:     FuturesSideDto;
  @ApiProperty({ enum: FuturesOrderType })    @IsEnum(FuturesOrderType)      type:     FuturesOrderType;
  @ApiProperty({ example: 0.01 })             @IsNumber() @Min(0.000001)     size:     number;
  @ApiProperty({ example: 10 })               @IsInt() @Min(1) @Max(125)     leverage: number;
  @ApiProperty({ required: false })           @IsOptional() @IsNumber() @Min(0) price?: number;
  @ApiProperty({ required: false })           @IsOptional() @IsNumber() @Min(0) stopLoss?:   number;
  @ApiProperty({ required: false })           @IsOptional() @IsNumber() @Min(0) takeProfit?: number;
}

export class ClosePositionDto {
  @ApiProperty({ example: "position-uuid" })  @IsString()                    positionId: string;
  @ApiProperty({ required: false })           @IsOptional() @IsNumber() @Min(0) size?:   number;
}

export class SetLeverageDto {
  @ApiProperty({ example: "BTCUSDT" }) @IsString()                           symbol:   string;
  @ApiProperty({ example: 10 })        @IsInt() @Min(1) @Max(125)            leverage: number;
}
