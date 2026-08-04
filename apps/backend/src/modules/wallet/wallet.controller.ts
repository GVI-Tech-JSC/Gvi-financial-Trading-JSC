/**
 * VNKR Trade — Finance / Wallet Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Routes bám sát API_ROUTE_MAP_REPORT.txt §4 FINANCE
 */
import {
  Controller, Get, Post, Body, Query, Param, UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { WalletService } from "./wallet.service";
import { TransferDto, DepositDto, WithdrawDto } from "./dto/wallet.dto";
import { JwtAuthGuard }  from "../../common/guards/jwt-auth.guard";
import { CurrentUser }   from "../../common/decorators/current-user.decorator";

@ApiTags("finance")
@Controller("api/finance")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private walletSvc: WalletService) {}

  // ── Ví ──────────────────────────────────────────────────────
  @Get("wallet")
  @ApiOperation({ summary: "Danh sách ví" })
  getWallets(@CurrentUser() user: any) {
    return this.walletSvc.getWallets(user.sub);
  }

  @Get("wallet/stats")
  @ApiOperation({ summary: "Thống kê ví" })
  getWalletStats(@CurrentUser() user: any) {
    return this.walletSvc.getWalletStats(user.sub);
  }

  @Get("wallet/symbol")
  @ApiOperation({ summary: "Ví theo symbol/currency" })
  @ApiQuery({ name: "currency", required: true })
  getWalletBySymbol(@CurrentUser() user: any, @Query("currency") currency: string) {
    return this.walletSvc.getWalletBySymbol(user.sub, currency);
  }

  @Get("wallet/:type")
  @ApiOperation({ summary: "Ví theo loại (spot/fiat/futures...)" })
  getWalletByType(@CurrentUser() user: any, @Param("type") type: string) {
    return this.walletSvc.getWalletByType(user.sub, type.toUpperCase());
  }

  // ── Nạp tiền ───────────────────────────────────────────────
  @Post("deposit/spot")
  @ApiOperation({ summary: "Nạp tiền Spot (crypto)" })
  depositSpot(@CurrentUser() user: any, @Body() dto: DepositDto) {
    return this.walletSvc.deposit(user.sub, { ...dto, walletType: "SPOT" as any });
  }

  @Post("deposit/fiat")
  @ApiOperation({ summary: "Nạp tiền Fiat (banking)" })
  depositFiat(@CurrentUser() user: any, @Body() dto: DepositDto) {
    return this.walletSvc.deposit(user.sub, { ...dto, walletType: "FIAT" as any });
  }

  // ── Rút tiền ───────────────────────────────────────────────
  @Post("withdraw/spot")
  @ApiOperation({ summary: "Rút tiền Spot" })
  withdrawSpot(@CurrentUser() user: any, @Body() dto: WithdrawDto) {
    return this.walletSvc.withdraw(user.sub, { ...dto, walletType: "SPOT" as any });
  }

  @Post("withdraw/fiat")
  @ApiOperation({ summary: "Rút tiền Fiat" })
  withdrawFiat(@CurrentUser() user: any, @Body() dto: WithdrawDto) {
    return this.walletSvc.withdraw(user.sub, { ...dto, walletType: "FIAT" as any });
  }

  // ── Giao dịch & Chuyển khoản ──────────────────────────────
  @Get("transaction")
  @ApiOperation({ summary: "Lịch sử giao dịch" })
  @ApiQuery({ name: "type",     required: false })
  @ApiQuery({ name: "currency", required: false })
  getTransactions(
    @CurrentUser() user: any,
    @Query("type")     type?:     string,
    @Query("currency") currency?: string,
  ) {
    return this.walletSvc.getTransactions(user.sub, type, currency);
  }

  @Post("transfer")
  @ApiOperation({ summary: "Chuyển nội bộ giữa các ví" })
  transfer(@CurrentUser() user: any, @Body() dto: TransferDto) {
    return this.walletSvc.transfer(user.sub, dto);
  }

  // ── Tỷ giá ─────────────────────────────────────────────────
  @Get("exchange-rate")
  @ApiOperation({ summary: "Tỷ giá fiat realtime" })
  getExchangeRate() {
    return { rates: { USD: 1, VND: 25400, EUR: 0.93, JPY: 157 }, base: "USD" };
  }
}
