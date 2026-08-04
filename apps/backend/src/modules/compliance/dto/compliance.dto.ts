import { IsString, IsOptional, IsEnum, IsNumber, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum TxType { DEPOSIT = "DEPOSIT", WITHDRAW = "WITHDRAW" }

export class FlagStrDto {
  @ApiProperty() @IsString()              transactionId: string;
  @ApiProperty() @IsString()              reason:        string;
  @ApiProperty({ required: false })
  @IsOptional() @IsEnum(["LOW","MEDIUM","HIGH","CRITICAL"])
  severity?: string;
}

export class SubmitStrDto {
  @ApiProperty() @IsString() strReportId: string;
  @ApiProperty() @IsString() reportRef:   string;
}

export class DailyLimitQueryDto {
  @ApiProperty({ enum: TxType })   @IsEnum(TxType)    type:     TxType;
  @ApiProperty({ example: "VNKR"}) @IsString()        currency: string;
}
