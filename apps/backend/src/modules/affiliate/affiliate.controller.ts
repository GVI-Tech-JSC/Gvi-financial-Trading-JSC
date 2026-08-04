/**
 * VNKR Trade — Affiliate Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import {
  Controller, Get, Post, Body, Query, Param,
  UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { AffiliateService } from "./affiliate.service";
import { CreateTierDto, ValidateCodeDto } from "./dto/affiliate.dto";
import { JwtAuthGuard }     from "../../common/guards/jwt-auth.guard";
import { RolesGuard }       from "../../common/guards/roles.guard";
import { Roles }            from "../../common/decorators/roles.decorator";
import { CurrentUser }      from "../../common/decorators/current-user.decorator";

@ApiTags("affiliate")
@Controller("api")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AffiliateController {
  constructor(private affiliateSvc: AffiliateService) {}

  @Get("(ext)/affiliate")
  @ApiOperation({ summary: "Thông tin affiliate" })
  getInfo(@CurrentUser() u: any) { return this.affiliateSvc.getAffiliateInfo(u.sub); }

  @Get("(ext)/affiliate/stats")
  @ApiOperation({ summary: "Thống kê affiliate" })
  getStats(@CurrentUser() u: any) { return this.affiliateSvc.getStats(u.sub); }

  @Get("(ext)/affiliate/referral")
  @ApiOperation({ summary: "Danh sách referral" })
  getReferrals(@CurrentUser() u: any) { return this.affiliateSvc.getAffiliateInfo(u.sub); }

  @Get("(ext)/affiliate/referral/node")
  @ApiOperation({ summary: "Cây referral" })
  @ApiQuery({ name: "depth", required: false })
  getTree(@CurrentUser() u: any, @Query("depth") depth?: number) {
    return this.affiliateSvc.getReferralTree(u.sub, depth ?? 3);
  }

  @Get("(ext)/affiliate/condition")
  @ApiOperation({ summary: "Commission tiers" })
  getTiers() { return this.affiliateSvc.getTiers(); }

  @Post("referral/validate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Kiểm tra referral code" })
  validateCode(@Body() dto: ValidateCodeDto) {
    return this.affiliateSvc.validateCode(dto.code);
  }

  @Post("referral/apply")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Áp dụng referral code khi đăng ký" })
  applyCode(@CurrentUser() u: any, @Body("code") code: string) {
    return this.affiliateSvc.applyReferralCode(u.sub, code);
  }

  // ── Admin ──────────────────────────────────────────────────
  @Get("(ext)/admin/affiliate/referral")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Tất cả referrals (admin)" })
  adminGetReferrals(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) { return this.affiliateSvc.adminGetReferrals({ page, limit }); }

  @Post("(ext)/admin/affiliate/condition")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Tạo/cập nhật commission tier" })
  createTier(@Body() dto: CreateTierDto) {
    return this.affiliateSvc.createTier(dto);
  }
}
