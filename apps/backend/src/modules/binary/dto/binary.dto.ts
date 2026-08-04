import { IsString, IsNumber, IsIn, IsOptional, Min } from "class-validator";
export class PlaceBinaryOrderDto {
  @IsString()  symbol: string;
  @IsIn(["RISE","FALL"]) direction: "RISE"|"FALL";
  @IsNumber() @Min(1) amount: number;
  @IsNumber() @IsOptional() expirySeconds?: number;
}
