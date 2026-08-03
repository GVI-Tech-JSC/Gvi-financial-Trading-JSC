import { IsEmail, IsString, MinLength, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class RegisterDto {
  @ApiProperty({ example: "user@vnkr.vn" })
  @IsEmail() email: string;
  @ApiProperty({ example: "StrongPass123!" })
  @IsString() @MinLength(8) password: string;
  @ApiProperty({ example: "Nguyen" }) @IsOptional() @IsString() firstName?: string;
  @ApiProperty({ example: "Van A" })  @IsOptional() @IsString() lastName?:  string;
}
