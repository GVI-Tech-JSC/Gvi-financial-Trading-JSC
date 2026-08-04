import { IsString, IsInt, IsOptional, IsEnum, Min, Max } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SubmitKycDto {
  @ApiProperty({ example: 1 })           @IsInt() @Min(1) @Max(3)     level:        number;
  @ApiProperty({ example: "PASSPORT" })  @IsString()                  documentType: string;
  @ApiProperty({ required: false })      @IsOptional() @IsString()    frontUrl?:    string;
  @ApiProperty({ required: false })      @IsOptional() @IsString()    backUrl?:     string;
  @ApiProperty({ required: false })      @IsOptional() @IsString()    selfieUrl?:   string;
  @ApiProperty({ required: false })      @IsOptional() @IsString()    notes?:       string;
}

export class ReviewKycDto {
  @ApiProperty({ enum: ["APPROVED","REJECTED"] })
  @IsEnum(["APPROVED","REJECTED"])                                     status:   string;
  @ApiProperty({ required: false }) @IsOptional() @IsString()         reason?:  string;
}
