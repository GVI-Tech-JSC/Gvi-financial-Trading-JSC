import { IsString, IsNumber, IsIn, IsOptional, Min } from "class-validator";
export class CreateOfferDto {
  @IsIn(["BUY","SELL"]) type: "BUY"|"SELL";
  @IsString() currency: string;
  @IsString() fiatCurrency: string;
  @IsNumber() @Min(0) price: number;
  @IsNumber() @Min(0) minAmount: number;
  @IsNumber() @Min(0) maxAmount: number;
  @IsString() paymentMethod: string;
  @IsString() @IsOptional() terms?: string;
}
export class CreateTradeDto {
  @IsString() offerId: string;
  @IsNumber() @Min(0.001) amount: number;
}
