import { IsString, IsEnum, IsNumber, Min, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum WalletTypeDto {
  FIAT = "FIAT", SPOT = "SPOT", ECO = "ECO",
  FUTURES = "FUTURES", COPY_TRADING = "COPY_TRADING",
}

export class TransferDto {
  @ApiProperty({ enum: WalletTypeDto }) @IsEnum(WalletTypeDto)  fromType: WalletTypeDto;
  @ApiProperty({ enum: WalletTypeDto }) @IsEnum(WalletTypeDto)  toType:   WalletTypeDto;
  @ApiProperty({ example: "USDT" })     @IsString()             currency: string;
  @ApiProperty({ example: 100 })        @IsNumber() @Min(0.00000001) amount: number;
}

export class DepositDto {
  @ApiProperty({ example: "BTC" })      @IsString()             currency:   string;
  @ApiProperty({ example: "SPOT" })     @IsEnum(WalletTypeDto)  walletType: WalletTypeDto;
  @ApiProperty({ required: false })     @IsOptional() @IsString() txHash?:  string;
  @ApiProperty({ required: false })     @IsOptional() @IsNumber() @Min(0) amount?: number;
}

export class WithdrawDto {
  @ApiProperty({ example: "BTC" })      @IsString()              currency:   string;
  @ApiProperty({ example: "SPOT" })     @IsEnum(WalletTypeDto)   walletType: WalletTypeDto;
  @ApiProperty({ example: 0.001 })      @IsNumber() @Min(0.00000001) amount: number;
  @ApiProperty({ example: "bc1qxyz..." }) @IsString()            address:    string;
  @ApiProperty({ required: false })     @IsOptional() @IsString() network?:  string;
  @ApiProperty({ required: false })     @IsOptional() @IsString() memo?:     string;
}
