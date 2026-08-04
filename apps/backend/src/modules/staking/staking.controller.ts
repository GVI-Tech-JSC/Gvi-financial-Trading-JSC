import { Controller, Get, Post, Param, Body, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard }  from "../../common/guards/jwt-auth.guard";
import { RolesGuard }    from "../../common/guards/roles.guard";
import { Roles }         from "../../common/decorators/roles.decorator";
import { CurrentUser }   from "../../common/decorators/current-user.decorator";
import { StakingService } from "./staking.service";
import { StakeDto, CreatePoolDto } from "./dto/staking.dto";

@Controller("(ext)/staking")
export class StakingController {
  constructor(private stakingSvc: StakingService) {}

  @Get("pools")    getPools()                                             { return this.stakingSvc.getPools(); }
  @Get("pools/:id") getPool(@Param("id") id: string)                    { return this.stakingSvc.getPool(id); }

  @UseGuards(JwtAuthGuard)
  @Get("my")       getPositions(@CurrentUser() u: any)                  { return this.stakingSvc.getUserPositions(u.sub); }

  @UseGuards(JwtAuthGuard)
  @Post("stake")   stake(@Body() dto: StakeDto, @CurrentUser() u: any)  { return this.stakingSvc.stake(u.sub, dto); }

  @UseGuards(JwtAuthGuard)
  @Post("unstake/:id") unstake(@Param("id") id: string, @CurrentUser() u: any) { return this.stakingSvc.unstake(u.sub, id); }

  @UseGuards(JwtAuthGuard)
  @Get("preview/:id") preview(@Param("id") id: string)                  { return this.stakingSvc.previewRewards(id); }

  @UseGuards(JwtAuthGuard, RolesGuard) @Roles("admin")
  @Post("pools/create") createPool(@Body() dto: CreatePoolDto)          { return this.stakingSvc.createPool(dto); }
}
