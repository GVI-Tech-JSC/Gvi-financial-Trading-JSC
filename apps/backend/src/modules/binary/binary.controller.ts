/**
 * VNKR Trade — Binary Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Controller, Get, Post, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery }       from "@nestjs/swagger";
import { BinaryService }    from "./binary.service";
import { PlaceBinaryOrderDto } from "./dto/binary.dto";
import { JwtAuthGuard }     from "../../common/guards/jwt-auth.guard";
import { CurrentUser }      from "../../common/decorators/current-user.decorator";

@ApiTags("binary")
@Controller("api/exchange/binary")
export class BinaryController {
  constructor(private binarySvc: BinaryService) {}

  @Get("market")
  @ApiOperation({ summary: "Thị trường binary" })
  getMarkets() { return this.binarySvc.getMarkets(); }

  @Get("market/:symbol")
  getMarket(@Param("symbol") symbol: string) { return this.binarySvc.getMarket(symbol); }

  @Get("settings")
  @ApiOperation({ summary: "Cài đặt binary" })
  getSettings() { return this.binarySvc.getSettings(); }

  @Get("leaderboard")
  @ApiOperation({ summary: "Bảng xếp hạng binary" })
  getLeaderboard() { return this.binarySvc.getLeaderboard(); }

  @Post("order")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Đặt lệnh binary" })
  placeOrder(@CurrentUser() user: any, @Body() dto: PlaceBinaryOrderDto) {
    return this.binarySvc.placeOrder(user.sub, dto);
  }

  @Get("order")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Danh sách lệnh binary" })
  @ApiQuery({ name: "status", required: false, enum: ["pending","closed"] })
  getOrders(@CurrentUser() user: any, @Query("status") status?: "pending"|"closed") {
    return this.binarySvc.getOrders(user.sub, status);
  }
}
