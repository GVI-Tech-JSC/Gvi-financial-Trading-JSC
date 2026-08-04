import { IsString, IsEnum, IsNumber, IsOptional, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum OrderSideDto  { BUY = "BUY",  SELL = "SELL" }
export enum OrderTypeDto  { MARKET = "MARKET", LIMIT = "LIMIT" }
export enum TimeInForceDto{ GTC = "GTC", IOC = "IOC", FOK = "FOK", PO = "PO" }

export class CreateOrderDto {
  @ApiProperty({ example: "BTC/USDT" }) @IsString()                   symbol:      string;
  @ApiProperty({ enum: OrderSideDto })  @IsEnum(OrderSideDto)          side:        OrderSideDto;
  @ApiProperty({ enum: OrderTypeDto })  @IsEnum(OrderTypeDto)          type:        OrderTypeDto;
  @ApiProperty({ example: 0.001 })      @IsNumber() @Min(0)            amount:      number;
  @ApiProperty({ required: false })     @IsOptional() @IsNumber() @Min(0) price?:   number;
  @ApiProperty({ required: false, enum: TimeInForceDto })
  @IsOptional() @IsEnum(TimeInForceDto)                                timeInForce?: TimeInForceDto;
}
