/**
 * VNKR Trade — Affiliate Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Controller, Get, Post, Body, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { JwtAuthGuard }    from "../../common/guards/jwt-auth.guard";
import { RolesGuard }      from "../../common/guards/roles.guard";
import { Roles }           from "../../common/decorators/roles.decorator";
import { CurrentUser }     from "../../common/decorators/current-user.decorator";
import { AffiliateService }from "./affiliate.service";

@Controller("affiliate")
@UseGuards(JwtAuthGuard)
export class AffiliateController {
  constructor(private affiliateSvc: AffiliateService) {}

  @Get("info")        getInfo(@CurrentUser() u: any)    { return this.affiliateSvc.getAffiliateInfo(u.sub); }
  @Get("tree")        getTree(@CurrentUser() u: any)    { return this.affiliateSvc.getReferralTree(u.sub); }
  @Get("leaderboard") getLeaderboard()                  { return this.affiliateSvc.getLeaderboard(); }

  @Post("apply")
  applyCode(@Body() body: { referralCode: string }, @CurrentUser() u: any) {
    return this.affiliateSvc.applyReferralCode(u.sub, body.referralCode);
  }

  @Get("stats")
  getStats(@CurrentUser() u: any) { return this.affiliateSvc.getAffiliateInfo(u.sub); }

  @UseGuards(RolesGuard)
  @Roles("admin")
  @Get("admin/referrals")
  adminGetReferrals(
    @Query("page",  new DefaultValuePipe(1),  ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.affiliateSvc.getLeaderboard(limit);
  }
}
