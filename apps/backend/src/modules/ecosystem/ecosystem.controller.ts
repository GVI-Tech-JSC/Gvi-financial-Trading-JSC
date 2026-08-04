import { Controller, Get, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard }    from "../../common/guards/jwt-auth.guard";
import { RolesGuard }      from "../../common/guards/roles.guard";
import { Roles }           from "../../common/decorators/roles.decorator";
import { CurrentUser }     from "../../common/decorators/current-user.decorator";
import { EcosystemService } from "./ecosystem.service";

@Controller("(ext)/ecosystem")
export class EcosystemController {
  constructor(private ecoSvc: EcosystemService) {}

  @Get("blockchains") getBlockchains()                   { return this.ecoSvc.getBlockchains(); }
  @Get("tokens")      getTokens(@Query("chain") c?: string) { return this.ecoSvc.getTokens(c); }
  @Get("fee/:network") getFee(@Param("network") n: string) { return this.ecoSvc.getNetworkFee(n); }

  @UseGuards(JwtAuthGuard)
  @Get("wallet")
  getWallet(@CurrentUser() u: any) { return this.ecoSvc.getUserWallet(u.sub); }

  @UseGuards(JwtAuthGuard)
  @Get("deposit-address")
  getDepositAddress(@CurrentUser() u: any, @Query("currency") currency: string, @Query("network") network: string) {
    return this.ecoSvc.getDepositAddress(u.sub, currency, network);
  }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("admin")
  @Post("blockchains")
  createBlockchain(@Body() dto: any) { return this.ecoSvc.createBlockchain(dto); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("admin")
  @Post("tokens")
  createToken(@Body() dto: any) { return this.ecoSvc.createToken(dto); }
}
