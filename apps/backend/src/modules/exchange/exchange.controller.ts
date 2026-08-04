import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ExchangeService } from "./exchange.service";
import { OrderService }    from "./order.service";
import { CreateOrderDto }  from "./dto/create-order.dto";

@Controller("exchange")
export class ExchangeController {
  constructor(private exchangeSvc: ExchangeService, private orderSvc: OrderService) {}

  @Get("market")     getMarkets()                                   { return this.exchangeSvc.getMarkets(); }
  @Get("currencies") getCurrencies()                                { return this.exchangeSvc.getAvailableCurrencies(); }
  @Get("search")     searchMarkets(@Query("q") q: string)          { return this.exchangeSvc.searchMarkets(q ?? ""); }
  @Get("ticker/:symbol") getTicker(@Param("symbol") s: string)     { return this.exchangeSvc.getTicker(s.replace("-","/")); }
  @Get("orderbook")  getOrderBook(@Query("symbol") sym: string)    { return this.exchangeSvc.getOrderBook(sym); }
  @Get("ohlcv")      getOhlcv(@Query("symbol") sym: string, @Query("timeframe") tf = "1h") { return this.exchangeSvc.getOhlcv(sym, tf); }
  @Get("trades")     getTrades(@Query("symbol") sym: string)       { return this.exchangeSvc.getTrades(sym); }

  @UseGuards(JwtAuthGuard)
  @Post("orders")
  createOrder(@Body() dto: CreateOrderDto, @CurrentUser() u: any) { return this.orderSvc.createOrder(u.sub, dto); }

  @UseGuards(JwtAuthGuard)
  @Get("orders")
  getOrders(@CurrentUser() u: any, @Query("symbol") sym?: string, @Query("status") status?: string) {
    return this.orderSvc.getOrders(u.sub, sym, status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("orders/:id")
  cancelOrder(@Param("id") id: string, @CurrentUser() u: any) { return this.orderSvc.cancelOrder(u.sub, id); }
}
