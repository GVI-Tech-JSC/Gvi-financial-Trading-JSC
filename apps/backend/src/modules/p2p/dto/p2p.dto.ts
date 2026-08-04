import { IsString, IsEnum, IsNumber, IsOptional, IsArray, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum P2pSide { BUY = "BUY", SELL = "SELL" }

export class CreateOfferDto {
  @ApiProperty({ enum: P2pSide })    @IsEnum(P2pSide)              side:           P2pSide;
  @ApiProperty({ example: "USDT" }) @IsString()                    currency:       string;
  @ApiProperty({ example: "VND" })  @IsString()                    fiatCurrency:   string;
  @ApiProperty({ example: 25400 })  @IsNumber() @Min(0)            price:          number;
  @ApiProperty({ example: 10 })     @IsNumber() @Min(0)            minAmount:      number;
  @ApiProperty({ example: 1000 })   @IsNumber() @Min(0)            maxAmount:      number;
  @ApiProperty({ example: 1000 })   @IsNumber() @Min(0)            available:      number;
  @ApiProperty({ required: false }) @IsOptional() @IsArray()        paymentMethods?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsString()       terms?:         string;
}

export class CreateTradeDto {
  @ApiProperty({ example: "offer-uuid" }) @IsString()              offerId: string;
  @ApiProperty({ example: 100 })          @IsNumber() @Min(0)      amount:  number;
}

export class ConfirmPaymentDto {
  @ApiProperty({ example: "trade-uuid" }) @IsString()              tradeId:      string;
  @ApiProperty({ required: false })       @IsOptional() @IsString() paymentProof?: string;
}

export class DisputeDto {
  @ApiProperty({ example: "trade-uuid" }) @IsString() tradeId: string;
  @ApiProperty()                          @IsString() reason:  string;
}
