import { IsString, IsNumber, IsIn, IsOptional, Min, Max } from "class-validator";
export class OpenPositionDto {
  @IsString()  symbol: string;
  @IsIn(["LONG","SHORT"]) side: "LONG"|"SHORT";
  @IsNumber() @Min(1) @Max(125) leverage: number;
  @IsNumber() @Min(1) margin: number;
}
export class ClosePositionDto {
  @IsString() positionId: string;
  @IsNumber() @IsOptional() @Min(0.01) closePercent?: number;
}
