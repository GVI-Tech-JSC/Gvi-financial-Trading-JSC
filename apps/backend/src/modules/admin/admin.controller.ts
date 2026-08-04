/**
 * VNKR Trade — Admin Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { JwtAuthGuard }  from "../../common/guards/jwt-auth.guard";
import { RolesGuard }    from "../../common/guards/roles.guard";
import { Roles }         from "../../common/decorators/roles.decorator";
import { CurrentUser }   from "../../common/decorators/current-user.decorator";
import { AdminService }  from "./admin.service";
import { AdjustWalletDto, UpdateUserDto } from "./dto/admin.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "superadmin")
export class AdminController {
  constructor(private adminSvc: AdminService) {}

  @Get("dashboard") getDashboard() { return this.adminSvc.getDashboard(); }
  @Get("stats")     getStats()     { return this.adminSvc.getStats(); }
  @Get("health")    getHealth()    { return this.adminSvc.getHealth(); }

  @Get("users")
  getUsers(
    @Query("page",  new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("search") search?: string,
  ) { return this.adminSvc.getUsers(page, limit, search); }

  @Get("users/:id")    getUser(@Param("id") id: string) { return this.adminSvc.getUser(id); }
  @Patch("users/:id")  updateUser(@Param("id") id: string, @Body() dto: UpdateUserDto) { return this.adminSvc.updateUser(id, dto); }
  @Post("users/:id/ban")   banUser(@Param("id") id: string)   { return this.adminSvc.banUser(id, true); }
  @Post("users/:id/unban") unbanUser(@Param("id") id: string) { return this.adminSvc.banUser(id, false); }

  @Post("wallets/adjust")
  adjustWallet(@Body() dto: AdjustWalletDto, @CurrentUser() admin: any) {
    return this.adminSvc.adjustWallet(admin.sub, dto);
  }

  @Get("settings")  getSettings()  { return this.adminSvc.getSettings(); }
  @Post("settings") setSetting(@Body() body: { key: string; value: string }) { return this.adminSvc.setSetting(body.key, body.value); }

  @Get("audit-log")
  getAuditLog(
    @Query("page",  new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) { return this.adminSvc.getAuditLog(page, limit); }

  @Get("extensions")   getExtensions()   { return this.adminSvc.getExtensions(); }
  @Get("announcements") getAnnouncements() { return this.adminSvc.getAnnouncements(); }
}
