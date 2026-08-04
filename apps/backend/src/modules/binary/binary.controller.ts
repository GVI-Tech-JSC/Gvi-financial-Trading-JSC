import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { BinaryService } from "./binary.service";
import { PlaceBinaryOrderDto } from "./dto/binary.dto";

@Controller("exchange/binary")
export class BinaryController {
  constructor(private binarySvc: BinaryService) {}
  @Get("leaderboard")                getLeaderboard()            { return this.binarySvc.getLeaderboard(); }
  @UseGuards(JwtAuthGuard)
  @Get("my")    getOrders(@CurrentUser() u: any)               { return this.binarySvc.getOrders(u.sub); }
  @UseGuards(JwtAuthGuard)
  @Post("place") place(@Body() dto: PlaceBinaryOrderDto, @CurrentUser() u: any) {
    return this.binarySvc.placeOrder(u.sub, dto);
  }
}
