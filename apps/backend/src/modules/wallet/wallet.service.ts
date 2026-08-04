/**
 * VNKR Trade — Wallet Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Double-entry ledger: balance / lockedBalance / transactions
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Decimal }       from "@prisma/client/runtime/library";
import { TransferDto, DepositDto, WithdrawDto } from "./dto/wallet.dto";

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  constructor(private prisma: PrismaService) {}

  async getOrCreate(userId: string, type: string, currency: string) {
    let wallet = await this.prisma.wallet.findFirst({ where: { userId, type: type as any, currency } });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({ data: { userId, type: type as any, currency, balance: new Decimal(0), lockedBalance: new Decimal(0) } });
    }
    return wallet;
  }

  async getWallets(userId: string) {
    return this.prisma.wallet.findMany({ where: { userId, isActive: true }, orderBy: [{ type: "asc" }, { currency: "asc" }] });
  }

  async getWalletByType(userId: string, type: string) {
    return this.prisma.wallet.findMany({ where: { userId, type: type as any, isActive: true } });
  }

  async getWalletBySymbol(userId: string, currency: string) {
    return this.prisma.wallet.findMany({ where: { userId, currency } });
  }

  async getWalletStats(userId: string) {
    const wallets = await this.getWallets(userId);
    const totalUSDT = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
    return { wallets, totalUSDT, count: wallets.length };
  }

  async assertBalance(userId: string, type: string, currency: string, required: number) {
    const wallet = await this.getOrCreate(userId, type, currency);
    const available = Number(wallet.balance) - Number(wallet.lockedBalance);
    if (available < required) {
      throw new BadRequestException(`Insufficient ${currency}. Available: ${available.toFixed(8)}, Required: ${required.toFixed(8)}`);
    }
  }

  async lockFunds(userId: string, type: string, currency: string, amount: number) {
    const wallet = await this.getOrCreate(userId, type, currency);
    await this.prisma.wallet.update({ where: { id: wallet.id }, data: { lockedBalance: { increment: amount } } });
  }

  async unlockFunds(userId: string, type: string, currency: string, amount: number) {
    const wallet = await this.getOrCreate(userId, type, currency);
    await this.prisma.wallet.update({ where: { id: wallet.id }, data: { lockedBalance: { decrement: amount } } });
  }

  async deductBalance(userId: string, type: string, currency: string, amount: number) {
    const wallet = await this.getOrCreate(userId, type, currency);
    await this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: amount }, lockedBalance: { decrement: amount } } });
  }

  async creditBalance(userId: string, type: string, currency: string, amount: number) {
    const wallet = await this.getOrCreate(userId, type, currency);
    await this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: amount } } });
  }

  async deposit(userId: string, dto: DepositDto) {
    const wallet = await this.getOrCreate(userId, dto.walletType, dto.currency);
    const tx = await this.prisma.transaction.create({
      data: { userId, type: "DEPOSIT", status: "PENDING", currency: dto.currency, amount: new Decimal(dto.amount ?? 0), txHash: dto.txHash, metadata: { walletType: dto.walletType } },
    });
    return { transaction: tx, wallet, message: "Deposit initiated — awaiting confirmation" };
  }

  async confirmDeposit(txId: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: txId } });
    if (!tx) throw new NotFoundException("Transaction not found");
    if (tx.status === "COMPLETED") throw new BadRequestException("Already confirmed");
    await this.prisma.$transaction([
      this.prisma.transaction.update({ where: { id: txId }, data: { status: "COMPLETED" } }),
      this.prisma.wallet.updateMany({ where: { userId: tx.userId, currency: tx.currency }, data: { balance: { increment: Number(tx.amount) } } }),
    ]);
    return { confirmed: true };
  }

  async withdraw(userId: string, dto: WithdrawDto) {
    await this.assertBalance(userId, dto.walletType, dto.currency, dto.amount);
    await this.lockFunds(userId, dto.walletType, dto.currency, dto.amount);
    const tx = await this.prisma.transaction.create({
      data: { userId, type: "WITHDRAW", status: "PENDING", currency: dto.currency, amount: new Decimal(dto.amount), metadata: { address: dto.address, network: dto.network, memo: dto.memo, walletType: dto.walletType } },
    });
    return { transaction: tx, message: "Withdrawal request submitted — awaiting review" };
  }

  async transfer(userId: string, dto: TransferDto) {
    if (dto.fromType === dto.toType) throw new BadRequestException("Cannot transfer to same wallet type");
    await this.assertBalance(userId, dto.fromType, dto.currency, dto.amount);
    await this.prisma.$transaction(async tx => {
      await tx.wallet.updateMany({ where: { userId, type: dto.fromType as any, currency: dto.currency }, data: { balance: { decrement: dto.amount } } });
      const dest = await tx.wallet.findFirst({ where: { userId, type: dto.toType as any, currency: dto.currency } });
      if (!dest) {
        await tx.wallet.create({ data: { userId, type: dto.toType as any, currency: dto.currency, balance: new Decimal(dto.amount), lockedBalance: new Decimal(0) } });
      } else {
        await tx.wallet.update({ where: { id: dest.id }, data: { balance: { increment: dto.amount } } });
      }
      await tx.transaction.create({ data: { userId, type: "TRANSFER", status: "COMPLETED", currency: dto.currency, amount: new Decimal(dto.amount), metadata: { from: dto.fromType, to: dto.toType } } });
    });
    return { success: true };
  }

  async getTransactions(userId: string, type?: string, currency?: string) {
    return this.prisma.transaction.findMany({
      where: { userId, ...(type ? { type: type as any } : {}), ...(currency ? { currency } : {}) },
      orderBy: { createdAt: "desc" }, take: 100,
    });
  }
}
