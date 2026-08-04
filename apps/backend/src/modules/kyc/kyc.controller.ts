import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard }   from "../../common/guards/roles.guard";
import { Roles }        from "../../common/decorators/roles.decorator";
import { CurrentUser }  from "../../common/decorators/current-user.decorator";
import { KycService }   from "./kyc.service";
import { SubmitKycDto, ReviewKycDto } from "./dto/kyc.dto";

@Controller("kyc")
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private kycSvc: KycService) {}
  @Get("status")  getStatus(@CurrentUser() u: any)                        { return this.kycSvc.getStatus(u.sub); }
  @Post("submit") submit(@Body() dto: SubmitKycDto, @CurrentUser() u: any){ return this.kycSvc.submit(u.sub, dto); }

  @UseGuards(RolesGuard) @Roles("admin")
  @Get("admin/applications")
  listApplications(@Query("status") status?: string) { return this.kycSvc.getApplications(status); }

  @UseGuards(RolesGuard) @Roles("admin")
  @Patch("admin/applications/:id")
  review(@Param("id") id: string, @Body() dto: ReviewKycDto, @CurrentUser() u: any) { return this.kycSvc.review(id, dto, u.sub); }
}
