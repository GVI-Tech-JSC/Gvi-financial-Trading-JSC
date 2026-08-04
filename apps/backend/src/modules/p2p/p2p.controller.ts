import { Controller, Get, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser }  from "../../common/decorators/current-user.decorator";
import { P2pService }   from "./p2p.service";
import { CreateOfferDto, CreateTradeDto } from "./dto/p2p.dto";

@Controller("(ext)/p2p")
export class P2pController {
  constructor(private p2pSvc: P2pService) {}

  @Get("offers")
  getOffers(@Query("type") type?: string, @Query("currency") currency?: string, @Query("fiat") fiat?: string) {
    return this.p2pSvc.getOffers(type, currency, fiat);
  }

  @UseGuards(JwtAuthGuard)
  @Post("offers")           createOffer(@Body() dto: CreateOfferDto, @CurrentUser() u: any) { return this.p2pSvc.createOffer(u.sub, dto); }
  @UseGuards(JwtAuthGuard)
  @Get("trades")            getTrades(@CurrentUser() u: any) { return this.p2pSvc.getTrades(u.sub); }
  @UseGuards(JwtAuthGuard)
  @Post("trades")           createTrade(@Body() dto: CreateTradeDto, @CurrentUser() u: any) { return this.p2pSvc.createTrade(u.sub, dto); }
  @UseGuards(JwtAuthGuard)
  @Post("trades/:id/pay")   confirmPayment(@Param("id") id: string, @CurrentUser() u: any) { return this.p2pSvc.confirmPayment(id, u.sub); }
  @UseGuards(JwtAuthGuard)
  @Post("trades/:id/release") release(@Param("id") id: string, @CurrentUser() u: any) { return this.p2pSvc.releaseFunds(id, u.sub); }
  @UseGuards(JwtAuthGuard)
  @Post("trades/:id/dispute") dispute(@Param("id") id: string, @Body() body: { reason: string }, @CurrentUser() u: any) {
    return this.p2pSvc.openDispute(id, u.sub, body.reason);
  }
}
