/**
 * VNKR Trade — Futures Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Routes bám sát /api/(ext)/futures/*
 */
import {
  Controller, Get, Post, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { FuturesService }    from "./futures.service";
import { OpenPositionDto, ClosePositionDto, SetLeverageDto } from "./dto/futures.dto";
import { JwtAuthGuard }      from "../../common/guards/jwt-auth.guard";
import { CurrentUser }       from "../../common/decorators/current-user.decorator";

@ApiTags("futures")
@Controller("api/futures")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FuturesController {
  constructor(private futuresSvc: FuturesService) {}

  @Get("market")
  @ApiOperation({ summary: "Danh sách thị trường Futures" })
  getMarkets() { return this.futuresSvc.getMarkets(); }

  @Get("market/:symbol")
  @ApiOperation({ summary: "Chi tiết thị trường" })
  getMarket(@Param("symbol") symbol: string) { return this.futuresSvc.getMarket(symbol); }

  @Get("funding-rate/:symbol")
  @ApiOperation({ summary: "Tỷ lệ funding hiện tại" })
  getFundingRate(@Param("symbol") symbol: string) { return this.futuresSvc.getFundingRate(symbol); }

  @Get("account")
  @ApiOperation({ summary: "Tài khoản futures (balance, equity, PnL)" })
  getAccount(@CurrentUser() user: any) { return this.futuresSvc.getAccount(user.sub); }

  @Get("position")
  @ApiOperation({ summary: "Vị thế đang mở" })
  @ApiQuery({ name: "status", required: false })
  getPositions(@CurrentUser() user: any, @Query("status") status?: string) {
    return this.futuresSvc.getPositions(user.sub, status);
  }

  @Get("position/:id")
  @ApiOperation({ summary: "Chi tiết vị thế" })
  getPosition(@CurrentUser() user: any, @Param("id") id: string) {
    return this.futuresSvc.getPosition(user.sub, id);
  }

  @Post("position")
  @ApiOperation({ summary: "Mở vị thế futures" })
  openPosition(@CurrentUser() user: any, @Body() dto: OpenPositionDto) {
    return this.futuresSvc.openPosition(user.sub, dto);
  }

  @Post("position/close")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đóng vị thế" })
  closePosition(@CurrentUser() user: any, @Body() dto: ClosePositionDto) {
    return this.futuresSvc.closePosition(user.sub, dto);
  }

  @Get("order")
  @ApiOperation({ summary: "Lịch sử lệnh futures" })
  getOrders(@CurrentUser() user: any) { return this.futuresSvc.getOrders(user.sub); }
}
