/**
 * VNKR Trade — Admin Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Routes bám sát API_ROUTE_MAP §5 + §12
 */
import {
  Controller, Get, Put, Post, Delete, Body, Param,
  Query, UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { AdminService }   from "./admin.service";
import { UpdateUserDto, AdjustWalletDto, UpdateSettingDto, UpdateExtensionDto } from "./dto/admin.dto";
import { JwtAuthGuard }   from "../../common/guards/jwt-auth.guard";
import { RolesGuard }     from "../../common/guards/roles.guard";
import { Roles }          from "../../common/decorators/roles.decorator";
import { CurrentUser }    from "../../common/decorators/current-user.decorator";

@ApiTags("admin")
@Controller("api/admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "superadmin")
@ApiBearerAuth()
export class AdminController {
  constructor(private adminSvc: AdminService) {}

  // ── Dashboard ────────────────────────────────────────────────
  @Get("dashboard")
  @ApiOperation({ summary: "Tổng quan dashboard admin" })
  getDashboard() { return this.adminSvc.getDashboard(); }

  @Get("stats")
  @ApiOperation({ summary: "KPI snapshot nền tảng" })
  getStats() { return this.adminSvc.getStats(); }

  @Get("activity")
  @ApiOperation({ summary: "Feed hoạt động gần đây" })
  @ApiQuery({ name: "limit", required: false })
  getActivity(@Query("limit") limit?: number) {
    return this.adminSvc.getActivity(limit ?? 50);
  }

  @Get("system/health")
  @ApiOperation({ summary: "Health check server" })
  getHealth() { return this.adminSvc.getHealth(); }

  // ── CRM / Users ──────────────────────────────────────────────
  @Get("crm/user")
  @ApiOperation({ summary: "Danh sách user" })
  @ApiQuery({ name: "page",   required: false })
  @ApiQuery({ name: "limit",  required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "role",   required: false })
  getUsers(
    @Query("page")   page?:   number,
    @Query("limit")  limit?:  number,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("role")   role?:   string,
  ) {
    return this.adminSvc.getUsers({ page, limit, search, status, role });
  }

  @Get("crm/user/:id")
  @ApiOperation({ summary: "Chi tiết user" })
  getUser(@Param("id") id: string) { return this.adminSvc.getUser(id); }

  @Put("crm/user/:id")
  @ApiOperation({ summary: "Cập nhật user" })
  updateUser(
    @Param("id") id: string,
    @CurrentUser() admin: any,
    @Body() dto: UpdateUserDto,
  ) { return this.adminSvc.updateUser(id, dto, admin.sub); }

  @Delete("crm/user/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Ban user" })
  banUser(@Param("id") id: string, @CurrentUser() admin: any) {
    return this.adminSvc.banUser(id, admin.sub);
  }

  @Get("crm/user/:id/sessions")
  @ApiOperation({ summary: "Danh sách phiên đăng nhập" })
  getUserSessions(@Param("id") id: string) { return this.adminSvc.getUserSessions(id); }

  @Delete("crm/user/:id/sessions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Thu hồi tất cả phiên" })
  revokeUserSessions(@Param("id") id: string) { return this.adminSvc.revokeUserSessions(id); }

  // ── Finance ──────────────────────────────────────────────────
  @Get("transaction")
  @ApiOperation({ summary: "Tất cả giao dịch" })
  @ApiQuery({ name: "page",   required: false })
  @ApiQuery({ name: "type",   required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "userId", required: false })
  getTransactions(
    @Query("page")   page?:   number,
    @Query("type")   type?:   string,
    @Query("status") status?: string,
    @Query("userId") userId?: string,
  ) { return this.adminSvc.getTransactions({ page, type, status, userId }); }

  @Get("finance/profit")
  @ApiOperation({ summary: "Lợi nhuận / revenue analytics" })
  getProfit() { return this.adminSvc.getProfit(); }

  @Post("wallet/adjust")
  @ApiOperation({ summary: "Điều chỉnh thủ công số dư ví" })
  adjustWallet(@Body() dto: AdjustWalletDto, @CurrentUser() admin: any) {
    return this.adminSvc.adjustWallet(dto, admin.sub);
  }

  // ── System ───────────────────────────────────────────────────
  @Get("settings")
  @ApiOperation({ summary: "Tất cả settings" })
  getSettings() { return this.adminSvc.getSettings(); }

  @Put("settings")
  @ApiOperation({ summary: "Cập nhật hàng loạt settings" })
  updateSettings(@Body() dto: UpdateSettingDto, @CurrentUser() admin: any) {
    return this.adminSvc.updateSettings(dto.settings, admin.sub);
  }

  @Get("audit-log")
  @ApiOperation({ summary: "Nhật ký kiểm toán hệ thống" })
  @ApiQuery({ name: "page",  required: false })
  @ApiQuery({ name: "limit", required: false })
  getAuditLog(@Query("page") page?: number, @Query("limit") limit?: number) {
    return this.adminSvc.getAuditLog(page ?? 1, limit ?? 50);
  }

  @Get("extension")
  @ApiOperation({ summary: "Danh sách extensions" })
  getExtensions() { return this.adminSvc.getExtensions(); }

  @Put("extension/:id")
  @ApiOperation({ summary: "Bật/tắt extension" })
  updateExtension(@Param("id") id: string, @Body() dto: UpdateExtensionDto) {
    return this.adminSvc.updateExtension(id, dto.status);
  }

  @Get("system/announcement")
  @ApiOperation({ summary: "Danh sách thông báo hệ thống" })
  getAnnouncements() { return this.adminSvc.getAnnouncements(); }

  @Post("system/announcement")
  @ApiOperation({ summary: "Tạo thông báo hệ thống" })
  createAnnouncement(@Body() body: { title: string; content: string; type?: string }) {
    return this.adminSvc.createAnnouncement(body);
  }
}
