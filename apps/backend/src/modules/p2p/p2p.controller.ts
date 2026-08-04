/**
 * VNKR Trade — P2P Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import {
  Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { P2pService }    from "./p2p.service";
import { CreateOfferDto, CreateTradeDto, ConfirmPaymentDto, DisputeDto } from "./dto/p2p.dto";
import { JwtAuthGuard }  from "../../common/guards/jwt-auth.guard";
import { RolesGuard }    from "../../common/guards/roles.guard";
import { Roles }         from "../../common/decorators/roles.decorator";
import { CurrentUser }   from "../../common/decorators/current-user.decorator";

@ApiTags("p2p")
@Controller("api")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class P2pController {
  constructor(private p2pSvc: P2pService) {}

  @Get("(ext)/p2p/offer")
  @ApiOperation({ summary: "Danh sách P2P offers" })
  @ApiQuery({ name: "side",         required: false })
  @ApiQuery({ name: "currency",     required: false })
  @ApiQuery({ name: "fiatCurrency", required: false })
  @ApiQuery({ name: "page",         required: false })
  getOffers(
    @Query("side")         side?:         string,
    @Query("currency")     currency?:     string,
    @Query("fiatCurrency") fiatCurrency?: string,
    @Query("page")         page?:         number,
  ) { return this.p2pSvc.getOffers({ side, currency, fiatCurrency, page }); }

  @Get("(ext)/p2p/offer/my")
  @ApiOperation({ summary: "Offers của tôi" })
  getMyOffers(@CurrentUser() u: any) { return this.p2pSvc.getMyOffers(u.sub); }

  @Post("(ext)/p2p/offer")
  @ApiOperation({ summary: "Tạo offer P2P" })
  createOffer(@CurrentUser() u: any, @Body() dto: CreateOfferDto) {
    return this.p2pSvc.createOffer(u.sub, dto);
  }

  @Delete("(ext)/p2p/offer/:id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Hủy offer" })
  cancelOffer(@CurrentUser() u: any, @Param("id") id: string) {
    return this.p2pSvc.cancelOffer(u.sub, id);
  }

  @Post("(ext)/p2p/trade")
  @ApiOperation({ summary: "Tạo giao dịch P2P" })
  createTrade(@CurrentUser() u: any, @Body() dto: CreateTradeDto) {
    return this.p2pSvc.createTrade(u.sub, dto);
  }

  @Post("(ext)/p2p/trade/confirm-payment")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Xác nhận đã thanh toán fiat" })
  confirmPayment(@CurrentUser() u: any, @Body() dto: ConfirmPaymentDto) {
    return this.p2pSvc.confirmPayment(u.sub, dto);
  }

  @Post("(ext)/p2p/trade/:id/release")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Giải phóng crypto (release escrow)" })
  release(@CurrentUser() u: any, @Param("id") id: string) {
    return this.p2pSvc.releaseFunds(u.sub, id);
  }

  @Post("(ext)/p2p/trade/dispute")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mở tranh chấp" })
  dispute(@CurrentUser() u: any, @Body() dto: DisputeDto) {
    return this.p2pSvc.openDispute(u.sub, dto);
  }

  @Get("(ext)/p2p/trade")
  @ApiOperation({ summary: "Lịch sử giao dịch P2P" })
  @ApiQuery({ name: "status", required: false })
  getTrades(@CurrentUser() u: any, @Query("status") status?: string) {
    return this.p2pSvc.getTrades(u.sub, status);
  }

  @Get("(ext)/admin/p2p/dispute")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @ApiOperation({ summary: "Danh sách tranh chấp (admin)" })
  adminGetDisputes() { return this.p2pSvc.adminGetDisputes(); }

  @Post("(ext)/admin/p2p/dispute/:id/resolve")
  @UseGuards(RolesGuard) @Roles("admin","superadmin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Giải quyết tranh chấp" })
  adminResolve(
    @Param("id") id: string,
    @Body("releaseToUserId") releaseToUserId: string,
  ) { return this.p2pSvc.adminResolveTrade(id, releaseToUserId); }
}
