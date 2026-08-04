import { IsString, IsNumber, IsOptional, IsInt, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateTierDto {
  @ApiProperty({ example: 1 })    @IsInt() @Min(1) @Max(10)     level:      number;
  @ApiProperty({ example: 10 })   @IsNumber() @Min(0) @Max(100) percentage: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber()   minVolume?: number;
}

export class ClaimRewardDto {
  @ApiProperty({ example: "reward-uuid" }) @IsString() rewardId: string;
}

export class ValidateCodeDto {
  @ApiProperty({ example: "REF123" }) @IsString() code: string;
}
