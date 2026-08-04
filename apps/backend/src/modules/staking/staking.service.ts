import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { WalletService }  from "../wallet/wallet.service";
import { Decimal }        from "@prisma/client/runtime/library";
import { StakeDto, CreatePoolDto } from "./dto/staking.dto";

@Injectable()
export class StakingService {
  private readonly logger = new Logger(StakingService.name);
  constructor(private prisma: PrismaService, private wallets: WalletService) {}

  async getPools() {
    return this.prisma.stakingPool.findMany({ where: { status: "ACTIVE" }, orderBy: { apy: "desc" } });
  }

  async getPool(id: string) {
    const p = await this.prisma.stakingPool.findUnique({ where: { id } });
    if (!p) throw new NotFoundException("Pool not found");
    return p;
  }

  async createPool(dto: CreatePoolDto) {
    return this.prisma.stakingPool.create({ data: { ...dto } as any });
  }

  async stake(userId: string, dto: StakeDto) {
    const pool = await this.getPool(dto.poolId);
    if (dto.amount < Number(pool.minAmount)) throw new BadRequestException(`Minimum stake: ${pool.minAmount} ${pool.currency}`);
    await this.wallets.assertBalance(userId, "SPOT", pool.currency, dto.amount);
    await this.wallets.lockFunds(userId, "SPOT", pool.currency, dto.amount);
    const unlocksAt = new Date(Date.now() + pool.lockDays * 86_400_000);
    const position  = await this.prisma.stakingPosition.create({
      data: { userId, poolId: dto.poolId, amount: new Decimal(dto.amount), status: "ACTIVE", stakedAt: new Date(), unlocksAt },
    });
    await this.prisma.stakingPool.update({ where: { id: dto.poolId }, data: { totalStaked: { increment: dto.amount } } });
    await this.prisma.transaction.create({ data: { userId, type: "STAKING", status: "COMPLETED", currency: pool.currency, amount: new Decimal(dto.amount), description: `Staked in ${pool.name}` } });
    return position;
  }

  async unstake(userId: string, positionId: string) {
    const pos = await this.prisma.stakingPosition.findUnique({ where: { id: positionId }, include: { pool: true } });
    if (!pos || pos.userId !== userId) throw new NotFoundException("Stake not found");
    if (pos.status !== "ACTIVE") throw new BadRequestException("Stake not active");
    if (new Date() < pos.unlocksAt) throw new BadRequestException(`Locked until ${pos.unlocksAt.toLocaleDateString()}`);
    const total = Number(pos.amount) + Number(pos.accruedReward);
    await this.prisma.$transaction(async tx => {
      await tx.stakingPosition.update({ where: { id: positionId }, data: { status: "COMPLETED", unstakedAt: new Date() } });
      await tx.stakingPool.update({ where: { id: pos.poolId }, data: { totalStaked: { decrement: Number(pos.amount) } } });
      await tx.wallet.updateMany({ where: { userId, type: "SPOT", currency: pos.pool.currency }, data: { balance: { increment: total }, lockedBalance: { decrement: Number(pos.amount) } } });
      await tx.transaction.create({ data: { userId, type: "STAKING", status: "COMPLETED", currency: pos.pool.currency, amount: new Decimal(total), description: `Unstaked from ${pos.pool.name}` } });
    });
    return { unstaked: true, returned: total };
  }

  async getUserPositions(userId: string) {
    return this.prisma.stakingPosition.findMany({
      where: { userId }, include: { pool: true }, orderBy: { stakedAt: "desc" },
    });
  }

  async previewRewards(positionId: string) {
    const pos = await this.prisma.stakingPosition.findUnique({ where: { id: positionId }, include: { pool: true } });
    if (!pos) throw new NotFoundException("Position not found");
    const days   = (Date.now() - pos.stakedAt.getTime()) / 86_400_000;
    const daily  = Number(pos.amount) * (pos.pool.apy / 100) / 365;
    const earned = daily * days;
    return { earned, daily, daysStaked: Math.floor(days), apy: pos.pool.apy };
  }
}
