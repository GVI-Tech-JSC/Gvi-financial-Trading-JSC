/**
 * VNKR Trade — Compliance Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Routes bám sát API_ROUTE_MAP §11 COMPLIANCE
 */
import {
  Controller, Get, Post, Body, Query, Param,
  UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ComplianceService }  from "./compliance.service";
import { FlagStrDto, SubmitStrDto, DailyLimitQueryDto } from "./dto/compliance.dto";
import { JwtAuthGuard }       from "../../common/guards/jwt-auth.guard";
import { RolesGuard }         from "../../common/guards/roles.guard";
import { Roles }              from "../../common/decorators/roles.decorator";
import { CurrentUser }        from "../../common/decorators/current-user.decorator";

@ApiTags("compliance")
@Controller("api")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComplianceController {
  constructor(private complianceSvc: ComplianceService) {}

  // ── User: daily limit ─────────────────────────────────────
  @Get("finance/daily-limit")
  @ApiOperation({ summary: "Hạn mức giao dịch hàng ngày (NQ-05 Điều 7)" })
  getDailyLimit(@CurrentUser() u: any, @Query() dto: DailyLimitQueryDto) {
    return this.complianceSvc.getDailyLimit(u.sub, dto.type, dto.currency);
  }

  @Get("user/compliance/ico-eligibility")
  @ApiOperation({ summary: "Kiểm tra tư cách tham gia ICO (NQ-05 Điều 6)" })
  checkIcoEligibility(@CurrentUser() u: any) {
    return this.complianceSvc.checkIcoEligibility(u.sub);
  }

  // ── Admin: STR ────────────────────────────────────────────
  @Get("admin/compliance/str/summary")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Danh sách STR chưa báo cáo (NĐ-284 Điều 9)" })
  getStrSummary() { return this.complianceSvc.getStrSummary(); }

  @Post("admin/compliance/str/flag")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đánh dấu giao dịch đáng ngờ" })
  flagStr(@Body() dto: FlagStrDto, @CurrentUser() u: any) {
    return this.complianceSvc.flagTransaction(dto, u.sub);
  }

  @Post("admin/compliance/str/report")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đánh dấu STR đã nộp báo cáo" })
  submitStr(@Body() dto: SubmitStrDto, @CurrentUser() u: any) {
    return this.complianceSvc.submitStrReport(dto, u.sub);
  }

  @Post("admin/compliance/str/:id/escalate")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Escalate STR" })
  escalateStr(@Param("id") id: string, @CurrentUser() u: any) {
    return this.complianceSvc.escalateStr(id, u.sub);
  }

  // ── Admin: AML/monitoring ─────────────────────────────────
  @Get("admin/compliance/alerts")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Cảnh báo compliance" })
  @ApiQuery({ name: "status", required: false })
  getAlerts(@Query("status") status?: string) {
    return this.complianceSvc.getAlerts(status);
  }

  @Get("admin/compliance/blacklist")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Danh sách đen" })
  getBlacklist() { return this.complianceSvc.getBlacklist(); }

  @Post("admin/compliance/blacklist")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Thêm vào danh sách đen" })
  addBlacklist(@Body() body: { type: string; value: string; reason: string }) {
    return this.complianceSvc.addToBlacklist(body.type, body.value, body.reason);
  }

  @Get("admin/compliance/transaction-monitoring")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Giám sát giao dịch AML" })
  @ApiQuery({ name: "page",      required: false })
  @ApiQuery({ name: "minAmount", required: false })
  getMonitoring(
    @Query("page")      page?:      number,
    @Query("minAmount") minAmount?: number,
  ) {
    return this.complianceSvc.getTransactionMonitoring({ page, minAmount });
  }
}
