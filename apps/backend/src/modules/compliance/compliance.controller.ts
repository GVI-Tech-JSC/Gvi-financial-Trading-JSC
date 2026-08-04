import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { JwtAuthGuard }    from "../../common/guards/jwt-auth.guard";
import { RolesGuard }      from "../../common/guards/roles.guard";
import { Roles }           from "../../common/decorators/roles.decorator";
import { CurrentUser }     from "../../common/decorators/current-user.decorator";
import { ComplianceService } from "./compliance.service";

@Controller("compliance")
@UseGuards(JwtAuthGuard)
export class ComplianceController {
  constructor(private complianceSvc: ComplianceService) {}

  @Get("check-limit")
  checkLimit(@Query("amount") amount: string, @CurrentUser() u: any) {
    return this.complianceSvc.checkTransactionLimit(u.sub, parseFloat(amount ?? "0"));
  }

  @Get("my-risk")
  getMyRisk(@CurrentUser() u: any) { return this.complianceSvc.getUserRisk(u.sub); }

  @Post("check-blacklist")
  checkBlacklist(@Body() body: { identifier: string }) { return this.complianceSvc.checkBlacklist(body.identifier); }

  @UseGuards(RolesGuard) @Roles("admin")
  @Get("alerts")
  getAlerts(
    @Query("status") status?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) { return this.complianceSvc.getAlerts(status, page, limit); }

  @UseGuards(RolesGuard) @Roles("admin")
  @Patch("alerts/:id/resolve")
  resolveAlert(@Param("id") id: string, @Body() body: { resolution: string }, @CurrentUser() admin: any) {
    return this.complianceSvc.resolveAlert(id, admin.sub, body.resolution);
  }

  @UseGuards(RolesGuard) @Roles("admin")
  @Get("blacklist")
  getBlacklist(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) { return this.complianceSvc.getBlacklist(page, limit); }

  @UseGuards(RolesGuard) @Roles("admin")
  @Post("blacklist")
  addBlacklist(@Body() body: { identifier: string; type: string; reason: string }, @CurrentUser() admin: any) {
    return this.complianceSvc.addToBlacklist(body.identifier, body.type, body.reason, admin.sub);
  }
}
