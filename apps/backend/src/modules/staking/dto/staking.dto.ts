import { IsString, IsNumber, IsOptional, IsBoolean, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class StakeDto {
  @ApiProperty({ example: "pool-uuid" }) @IsString()              poolId:  string;
  @ApiProperty({ example: 100 })         @IsNumber() @Min(0.00001) amount:  number;
  @ApiProperty({ required: false })      @IsOptional() @IsBoolean() autoCompound?: boolean;
}

export class UnstakeDto {
  @ApiProperty({ example: "position-uuid" }) @IsString() positionId: string;
}

export class CreatePoolDto {
  @ApiProperty() @IsString()               name:        string;
  @ApiProperty() @IsString()               currency:    string;
  @ApiProperty() @IsNumber() @Min(0)       apy:         number;
  @ApiProperty() @IsNumber() @Min(0)       minAmount:   number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() maxAmount?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() lockDays?:  number;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() autoCompound?: boolean;
}
