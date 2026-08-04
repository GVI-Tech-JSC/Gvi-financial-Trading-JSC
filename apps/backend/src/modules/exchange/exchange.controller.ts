/**
 * VNKR Trade — Exchange Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Routes bám sát API_ROUTE_MAP_REPORT.txt §3 EXCHANGE
 */
import {
  Controller, Get, Post, Delete, Query, Param, Body,
  UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { ExchangeService }  from "./exchange.service";
import { OrderService }     from "./order.service";
import { CreateOrderDto }   from "./dto/create-order.dto";
import { CandleQueryDto, OrderBookQueryDto } from "./dto/market-query.dto";
import { JwtAuthGuard }     from "../../common/guards/jwt-auth.guard";
import { CurrentUser }      from "../../common/decorators/current-user.decorator";

@ApiTags("exchange")
@Controller("api/exchange")
export class ExchangeController {
  constructor(
    private exchangeSvc: ExchangeService,
    private orderSvc:    OrderService,
  ) {}

  // ── Thị trường ─────────────────────────────────────────────
  @Get("market")
  @ApiOperation({ summary: "Danh sách thị trường Spot" })
  getMarkets() { return this.exchangeSvc.getMarkets(); }

  @Get("ticker")
  @ApiOperation({ summary: "Giá ticker realtime" })
  @ApiQuery({ name: "symbol", required: false })
  @ApiQuery({ name: "symbols", required: false })
  getTicker(
    @Query("symbol")  symbol?:  string,
    @Query("symbols") symbols?: string,
  ) {
    if (symbol)  return this.exchangeSvc.getTicker(symbol);
    if (symbols) return this.exchangeSvc.getTickers(symbols.split(","));
    return this.exchangeSvc.getTickers();
  }

  @Get("chart")
  @ApiOperation({ summary: "Dữ liệu nến OHLCV" })
  getChart(@Query() dto: CandleQueryDto) {
    return this.exchangeSvc.getCandles(dto);
  }

  @Get("orderbook")
  @ApiOperation({ summary: "Sổ lệnh order book" })
  getOrderBook(@Query() dto: OrderBookQueryDto) {
    return this.exchangeSvc.getOrderBook(dto);
  }

  @Get("trades")
  @ApiOperation({ summary: "Giao dịch gần đây" })
  @ApiQuery({ name: "symbol", required: true })
  @ApiQuery({ name: "limit",  required: false })
  getTrades(
    @Query("symbol") symbol: string,
    @Query("limit")  limit?:  number,
  ) {
    return this.exchangeSvc.getTrades(symbol, limit ?? 50);
  }

  @Get("currency")
  @ApiOperation({ summary: "Danh sách token / coin" })
  getCurrencies() { return this.exchangeSvc.getCurrencies(); }

  @Get("trading")
  @ApiOperation({ summary: "Cài đặt giao dịch" })
  getTradingSettings() { return this.exchangeSvc.getTradingSettings(); }

  @Get("watchlist")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Danh sách yêu thích" })
  getWatchlist(@CurrentUser() user: any) {
    return this.exchangeSvc.getWatchlist(user.sub);
  }

  // ── Lệnh Spot ──────────────────────────────────────────────
  @Post("order")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Đặt lệnh Spot" })
  createOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.orderSvc.createOrder(user.sub, dto);
  }

  @Get("order")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xem lệnh Spot" })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "symbol", required: false })
  getOrders(
    @CurrentUser() user: any,
    @Query("status") status?: string,
    @Query("symbol") symbol?: string,
  ) {
    return this.orderSvc.getOrders(user.sub, status, symbol);
  }

  @Get("order/open")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lệnh đang mở" })
  getOpenOrders(@CurrentUser() user: any) {
    return this.orderSvc.getOpenOrders(user.sub);
  }

  @Get("order/history")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lịch sử lệnh" })
  getOrderHistory(@CurrentUser() user: any) {
    return this.orderSvc.getOrderHistory(user.sub);
  }

  @Get("order/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Chi tiết lệnh" })
  getOrder(@CurrentUser() user: any, @Param("id") id: string) {
    return this.orderSvc.getOrder(user.sub, id);
  }

  @Delete("order/:id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Hủy lệnh theo ID" })
  cancelOrder(@CurrentUser() user: any, @Param("id") id: string) {
    return this.orderSvc.cancelOrder(user.sub, id);
  }

  // ── Binary sub-resource routing ────────────────────────────
  @Get("binary/market")
  @ApiOperation({ summary: "Thị trường binary" })
  getBinaryMarkets() {
    return { message: "See /api/binary/market" };
  }
}
