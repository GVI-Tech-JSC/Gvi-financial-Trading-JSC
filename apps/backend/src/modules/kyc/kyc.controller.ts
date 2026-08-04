/**
 * VNKR Trade — KYC Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { KycService }       from "./kyc.service";
import { SubmitKycDto, ReviewKycDto } from "./dto/kyc.dto";
import { JwtAuthGuard }     from "../../common/guards/jwt-auth.guard";
import { Roles }            from "../../common/decorators/roles.decorator";
import { RolesGuard }       from "../../common/guards/roles.guard";
import { CurrentUser }      from "../../common/decorators/current-user.decorator";

@ApiTags("kyc")
@Controller("api")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class KycController {
  constructor(private kycSvc: KycService) {}

  // ── User ─────────────────────────────────────────────────────
  @Get("user/kyc/level")
  @ApiOperation({ summary: "Cấp độ KYC của user" })
  getLevel(@CurrentUser() user: any) { return this.kycSvc.getUserLevel(user.sub); }

  @Get("user/kyc/application")
  @ApiOperation({ summary: "Hồ sơ KYC của user" })
  getApplication(@CurrentUser() user: any) { return this.kycSvc.getApplication(user.sub); }

  @Post("user/kyc/application")
  @ApiOperation({ summary: "Nộp hồ sơ KYC" })
  submitApplication(@CurrentUser() user: any, @Body() dto: SubmitKycDto) {
    return this.kycSvc.submitApplication(user.sub, dto);
  }

  @Get("user/kyc/aml")
  @ApiOperation({ summary: "AML screening kết quả" })
  checkAml(@CurrentUser() user: any) { return this.kycSvc.checkAml(user.sub); }

  // ── Admin ─────────────────────────────────────────────────────
  @Get("admin/crm/kyc/application")
  @UseGuards(RolesGuard) @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Danh sách hồ sơ KYC (admin)" })
  @ApiQuery({ name: "status", required: false })
  listApplications(@Query("status") status?: string) {
    return this.kycSvc.listApplications(status ?? "PENDING");
  }

  @Put("admin/crm/kyc/application/:id")
  @UseGuards(RolesGuard) @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Duyệt / từ chối KYC" })
  reviewApplication(
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewKycDto,
  ) {
    return this.kycSvc.reviewApplication(id, user.sub, dto);
  }
}
