import { IsOptional, IsString, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class CandleQueryDto {
  @ApiProperty({ example: "BTC/USDT" })         @IsString()                  symbol:    string;
  @ApiProperty({ example: "1h", required: false })
  @IsOptional() @IsString()                                                    timeframe?: string;
  @ApiProperty({ required: false })             @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1000)
  limit?: number;
}

export class OrderBookQueryDto {
  @ApiProperty({ example: "BTC/USDT" })         @IsString()                  symbol: string;
  @ApiProperty({ required: false, example: 20 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)                limit?: number;
}
