import { Controller, Get, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard }  from "../../common/guards/jwt-auth.guard";
import { CurrentUser }   from "../../common/decorators/current-user.decorator";
import { FuturesService } from "./futures.service";
import { OpenPositionDto } from "./dto/futures.dto";

@Controller("futures")
@UseGuards(JwtAuthGuard)
export class FuturesController {
  constructor(private futuresSvc: FuturesService) {}
  @Get("positions")         getPositions(@CurrentUser() u: any)               { return this.futuresSvc.getPositions(u.sub); }
  @Post("positions")        openPosition(@Body() dto: OpenPositionDto, @CurrentUser() u: any) { return this.futuresSvc.openPosition(u.sub, dto); }
  @Post("positions/:id/close") closePosition(@Param("id") id: string, @CurrentUser() u: any) { return this.futuresSvc.closePosition(u.sub, id); }
}
