import { IsString, IsOptional, IsBoolean } from "class-validator";
export class SubmitKycDto {
  @IsString() fullName: string;
  @IsString() idType: string;
  @IsString() idNumber: string;
  @IsString() @IsOptional() dob?: string;
  @IsString() @IsOptional() nationality?: string;
  @IsString() @IsOptional() address?: string;
}
export class ReviewKycDto {
  @IsBoolean() approved: boolean;
  @IsString() @IsOptional() rejectionReason?: string;
}
