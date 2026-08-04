/**
 * VNKR Trade — Ecosystem Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Routes bám sát API_ROUTE_MAP §6 ECOSYSTEM
 */
import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { EcosystemService }   from "./ecosystem.service";
import { ImportTokenDto, CreateMasterWalletDto, EcoWithdrawDto } from "./dto/ecosystem.dto";
import { JwtAuthGuard }       from "../../common/guards/jwt-auth.guard";
import { RolesGuard }         from "../../common/guards/roles.guard";
import { Roles }              from "../../common/decorators/roles.decorator";
import { CurrentUser }        from "../../common/decorators/current-user.decorator";

@ApiTags("ecosystem")
@Controller("api/(ext)/ecosystem")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EcosystemController {
  constructor(private ecoSvc: EcosystemService) {}

  @Get("market")
  @ApiOperation({ summary: "Thị trường DEX (blockchains + tokens)" })
  getMarkets() { return this.ecoSvc.getMarkets(); }

  @Get("token")
  @ApiOperation({ summary: "Danh sách token on-chain" })
  getTokens() { return this.ecoSvc.getTokens(); }

  @Get("wallet")
  @ApiOperation({ summary: "Ví blockchain custodial" })
  @ApiQuery({ name: "chain", required: false })
  getUserWallet(@CurrentUser() u: any, @Query("chain") chain?: string) {
    return this.ecoSvc.getUserWallet(u.sub, chain);
  }

  @Get("deposit")
  @ApiOperation({ summary: "Lịch sử nạp on-chain" })
  getDeposits(@CurrentUser() u: any) { return this.ecoSvc.getDeposits(u.sub); }

  // ── Admin ─────────────────────────────────────────────────
  @Post("admin/wallet/master")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Tạo master wallet" })
  createMasterWallet(@Body() dto: CreateMasterWalletDto) {
    return this.ecoSvc.createMasterWallet(dto);
  }

  @Get("admin/wallet/master/:chain")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Xem master wallet" })
  getMasterWallet(@Param("chain") chain: string) {
    return this.ecoSvc.getMasterWallet(chain);
  }

  @Post("admin/token/import")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Import token on-chain" })
  importToken(@Body() dto: ImportTokenDto) { return this.ecoSvc.importToken(dto); }

  @Post("admin/deposit/:id/confirm")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Xác nhận deposit on-chain" })
  confirmDeposit(@Param("id") id: string) { return this.ecoSvc.confirmDeposit(id); }
}
