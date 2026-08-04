import { IsString, IsOptional, IsEnum, IsInt, Min, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString()  firstName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString()  lastName?:  string;
  @ApiProperty({ required: false }) @IsOptional() @IsString()  role?:      string;
  @ApiProperty({ required: false }) @IsOptional() @IsString()  status?:    string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) kycLevel?: number;
}

export class AdjustWalletDto {
  @ApiProperty() @IsString()   userId:   string;
  @ApiProperty() @IsString()   currency: string;
  @ApiProperty() @IsString()   type:     string;
  @ApiProperty() @IsString()   amount:   string;
  @ApiProperty() @IsString()   reason:   string;
}

export class UpdateSettingDto {
  @ApiProperty() settings: Record<string, any>;
}

export class UpdateExtensionDto {
  @ApiProperty({ enum: ["ACTIVE","INACTIVE"] })
  @IsEnum(["ACTIVE","INACTIVE"]) status: string;
}
