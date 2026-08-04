import { IsString, IsOptional, IsNumber, Min, IsInt } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateMasterWalletDto {
  @ApiProperty({ example: "ETH" }) @IsString() chain: string;
}

export class EcoWithdrawDto {
  @ApiProperty() @IsString()               currency:  string;
  @ApiProperty() @IsString()               network:   string;
  @ApiProperty() @IsString()               toAddress: string;
  @ApiProperty() @IsNumber() @Min(0.000001) amount:   number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() memo?: string;
}

export class ImportTokenDto {
  @ApiProperty() @IsString() blockchainId:  string;
  @ApiProperty() @IsString() symbol:        string;
  @ApiProperty() @IsString() name:          string;
  @ApiProperty() @IsString() contractAddr:  string;
  @ApiProperty() @IsInt()    decimals:       number;
}
