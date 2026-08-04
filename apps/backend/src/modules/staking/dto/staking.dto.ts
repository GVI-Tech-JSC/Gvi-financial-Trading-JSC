import { IsString, IsNumber, IsOptional, Min, IsBoolean, IsInt } from "class-validator";
export class StakeDto {
  @IsString() poolId: string;
  @IsNumber() @Min(0.001) amount: number;
}
export class CreatePoolDto {
  @IsString() name: string;
  @IsString() currency: string;
  @IsNumber() apy: number;
  @IsNumber() minAmount: number;
  @IsInt() @IsOptional() lockDays?: number;
  @IsBoolean() @IsOptional() autoCompound?: boolean;
}
