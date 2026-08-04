/**
 * VNKR Trade — Staking Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { WalletService }  from "../wallet/wallet.service";
import { RewardEngine }   from "./engines/reward.engine";
import { StakeDto, UnstakeDto, CreatePoolDto } from "./dto/staking.dto";
import { Decimal }        from "@prisma/client/runtime/library";

@Injectable()
export class StakingService {
  private readonly logger = new Logger(StakingService.name);

  constructor(
    private prisma:   PrismaService,
    private wallets:  WalletService,
    private rewards:  RewardEngine,
  ) {}

  // ── Pools ─────────────────────────────────────────────────
  async getPools() {
    return this.prisma.stakingPool.findMany({
      where:   { status: "ACTIVE" },
      orderBy: { apy: "desc" },
    });
  }

  async getPool(id: string) {
    const p = await this.prisma.stakingPool.findUnique({ where: { id } });
    if (!p) throw new NotFoundException("Staking pool not found");
    return p;
  }

  async createPool(dto: CreatePoolDto) {
    return this.prisma.stakingPool.create({
      data: {
        name:        dto.name,
        currency:    dto.currency,
        apy:         new Decimal(dto.apy),
        minAmount:   new Decimal(dto.minAmount),
        maxAmount:   dto.maxAmount ? new Decimal(dto.maxAmount) : null,
        lockDays:    dto.lockDays ?? 0,
        autoCompound:dto.autoCompound ?? false,
        status:      "ACTIVE",
      },
    });
  }

  // ── Stake ──────────────────────────────────────────────────
  async stake(userId: string, dto: StakeDto) {
    const pool = await this.getPool(dto.poolId);

    if (dto.amount < Number(pool.minAmount))
      throw new BadRequestException(`Minimum stake is ${pool.minAmount} ${pool.currency}`);
    if (pool.maxAmount && dto.amount > Number(pool.maxAmount))
      throw new BadRequestException(`Maximum stake is ${pool.maxAmount} ${pool.currency}`);

    await this.wallets.assertBalance(userId, "SPOT", pool.currency, dto.amount);
    await this.wallets.deductBalance(userId, "SPOT", pool.currency, dto.amount);

    const endsAt = pool.lockDays > 0
      ? new Date(Date.now() + pool.lockDays * 86400000)
      : null;

    const position = await this.prisma.stakingPosition.create({
      data: {
        userId,
        poolId:      pool.id,
        amount:      new Decimal(dto.amount),
        earned:      new Decimal(0),
        status:      "ACTIVE",
        endsAt,
      },
    });

    await this.prisma.transaction.create({
      data: {
        userId, type: "STAKING", status: "COMPLETED",
        currency: pool.currency, amount: new Decimal(dto.amount),
        description: `Staked in ${pool.name}`, referenceId: position.id,
      },
    });

    this.logger.log(`Staked: ${userId} ${dto.amount} ${pool.currency} in ${pool.name}`);
    return position;
  }

  // ── Unstake ────────────────────────────────────────────────
  async unstake(userId: string, dto: UnstakeDto) {
    const pos = await this.prisma.stakingPosition.findFirst({
      where: { id: dto.positionId, userId, status: "ACTIVE" },
      include: { pool: true },
    });
    if (!pos) throw new NotFoundException("Active staking position not found");

    // Lock period check
    if (pos.endsAt && new Date() < pos.endsAt)
      throw new BadRequestException(
        `Locked until ${pos.endsAt.toISOString()} (${pos.pool.lockDays} days lock)`
      );

    const returnAmount = Number(pos.amount);
    const earned       = Number(pos.earned);

    await this.prisma.$transaction([
      this.prisma.stakingPosition.update({
        where: { id: pos.id },
        data:  { status: "COMPLETED", claimedAt: new Date() },
      }),
      // Return principal + unclaimed rewards
      this.prisma.wallet.updateMany({
        where: { userId, type: "SPOT", currency: pos.pool.currency },
        data:  { balance: { increment: returnAmount + earned } },
      }),
      this.prisma.transaction.create({
        data: {
          userId, type: "STAKING", status: "COMPLETED",
          currency: pos.pool.currency,
          amount:   new Decimal(returnAmount),
          description: `Unstaked from ${pos.pool.name}`,
          referenceId: pos.id,
        },
      }),
    ]);

    return { unstaked: true, returned: returnAmount, earned };
  }

  // ── User positions ─────────────────────────────────────────
  async getPositions(userId: string, status?: string) {
    return this.prisma.stakingPosition.findMany({
      where:   { userId, ...(status ? { status: status as any } : {}) },
      include: { pool: true },
      orderBy: { startedAt: "desc" },
    });
  }

  async getStats(userId: string) {
    const positions = await this.prisma.stakingPosition.findMany({
      where: { userId, status: "ACTIVE" },
      include: { pool: true },
    });
    const totalStaked  = positions.reduce((s, p) => s + Number(p.amount), 0);
    const totalEarned  = positions.reduce((s, p) => s + Number(p.earned), 0);
    const avgApy       = positions.length > 0
      ? positions.reduce((s, p) => s + Number(p.pool.apy), 0) / positions.length
      : 0;
    return { totalStaked, totalEarned, avgApy, activePositions: positions.length };
  }

  async calculateRewards(positionId: string) {
    return this.rewards.previewRewards(positionId);
  }

  // ── Admin ──────────────────────────────────────────────────
  async adminGetPositions(status?: string) {
    return this.prisma.stakingPosition.findMany({
      where:   status ? { status: status as any } : {},
      include: { pool: true },
      orderBy: { startedAt: "desc" },
      take:    200,
    });
  }

  async adminDistributeNow() {
    await this.rewards.distributeDaily();
    return { distributed: true };
  }
}
