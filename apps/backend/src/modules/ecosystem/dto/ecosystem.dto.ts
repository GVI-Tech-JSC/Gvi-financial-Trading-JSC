import { IsString, IsOptional, IsNumber, IsInt } from "class-validator";

export class CreateBlockchainDto {
  @IsString() name: string;
  @IsString() symbol: string;
  @IsInt() @IsOptional() chainId?: number;
  @IsString() @IsOptional() rpcUrl?: string;
  @IsString() @IsOptional() explorerUrl?: string;
  @IsString() nativeCoin: string;
}

export class CreateTokenDto {
  @IsString() blockchainId: string;
  @IsString() name: string;
  @IsString() symbol: string;
  @IsString() @IsOptional() contractAddress?: string;
  @IsInt() @IsOptional() decimals?: number;
}
