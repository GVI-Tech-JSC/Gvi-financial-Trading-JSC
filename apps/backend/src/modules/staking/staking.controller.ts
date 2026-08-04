/**
 * VNKR Trade — Staking Controller
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Routes bám sát API_ROUTE_MAP §6 STAKING
 */
import {
  Controller, Get, Post, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { StakingService } from "./staking.service";
import { StakeDto, UnstakeDto, CreatePoolDto } from "./dto/staking.dto";
import { JwtAuthGuard }   from "../../common/guards/jwt-auth.guard";
import { RolesGuard }     from "../../common/guards/roles.guard";
import { Roles }          from "../../common/decorators/roles.decorator";
import { CurrentUser }    from "../../common/decorators/current-user.decorator";

@ApiTags("staking")
@Controller("api")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StakingController {
  constructor(private stakingSvc: StakingService) {}

  // ── Public / User ──────────────────────────────────────────
  @Get("(ext)/staking/pool")
  @ApiOperation({ summary: "Danh sách pool staking" })
  getPools() { return this.stakingSvc.getPools(); }

  @Get("(ext)/staking/pool/:id")
  @ApiOperation({ summary: "Chi tiết pool" })
  getPool(@Param("id") id: string) { return this.stakingSvc.getPool(id); }

  @Post("(ext)/staking/position")
  @ApiOperation({ summary: "Stake — tạo vị thế" })
  stake(@CurrentUser() user: any, @Body() dto: StakeDto) {
    return this.stakingSvc.stake(user.sub, dto);
  }

  @Post("(ext)/staking/position/unstake")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Unstake" })
  unstake(@CurrentUser() user: any, @Body() dto: UnstakeDto) {
    return this.stakingSvc.unstake(user.sub, dto);
  }

  @Get("(ext)/staking/position")
  @ApiOperation({ summary: "Vị thế staking của user" })
  @ApiQuery({ name: "status", required: false })
  getPositions(@CurrentUser() user: any, @Query("status") status?: string) {
    return this.stakingSvc.getPositions(user.sub, status);
  }

  @Get("(ext)/staking/stats")
  @ApiOperation({ summary: "Thống kê staking user" })
  getStats(@CurrentUser() user: any) { return this.stakingSvc.getStats(user.sub); }

  @Get("(ext)/staking/calculate-rewards")
  @ApiOperation({ summary: "Tính phần thưởng dự kiến" })
  @ApiQuery({ name: "positionId", required: true })
  calculateRewards(@Query("positionId") positionId: string) {
    return this.stakingSvc.calculateRewards(positionId);
  }

  // ── Admin ──────────────────────────────────────────────────
  @Post("(ext)/admin/staking/pool")
  @UseGuards(RolesGuard) @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Tạo pool staking" })
  createPool(@Body() dto: CreatePoolDto) { return this.stakingSvc.createPool(dto); }

  @Get("(ext)/admin/staking/position")
  @UseGuards(RolesGuard) @Roles("admin", "superadmin")
  @ApiOperation({ summary: "Danh sách vị thế (admin)" })
  adminGetPositions(@Query("status") status?: string) {
    return this.stakingSvc.adminGetPositions(status);
  }

  @Post("(ext)/admin/staking/earning/distribute")
  @UseGuards(RolesGuard) @Roles("admin", "superadmin")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Phân phối thưởng ngay" })
  distributeNow() { return this.stakingSvc.adminDistributeNow(); }
}
