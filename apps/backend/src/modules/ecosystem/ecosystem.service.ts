/**
 * VNKR Trade — Ecosystem Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService }       from "../../prisma/prisma.service";
import { HdWalletService }     from "./services/hd-wallet.service";
import { DepositMonitorService }from "./services/deposit-monitor.service";
import { ImportTokenDto, CreateMasterWalletDto } from "./dto/ecosystem.dto";

@Injectable()
export class EcosystemService {
  constructor(
    private prisma:   PrismaService,
    private hdWallet: HdWalletService,
    private monitor:  DepositMonitorService,
  ) {}

  // ── Blockchains ───────────────────────────────────────────
  async getBlockchains() {
    return this.prisma.ecoBlockchain.findMany({ where: { status: "ACTIVE" } });
  }

  // ── Tokens ────────────────────────────────────────────────
  async getTokens() {
    return this.prisma.ecoToken.findMany({
      where:   { status: "ACTIVE" },
      include: { blockchain: { select: { name: true, symbol: true } } },
    });
  }

  async importToken(dto: ImportTokenDto) {
    return this.prisma.ecoToken.upsert({
      where:  { blockchainId_symbol: { blockchainId: dto.blockchainId, symbol: dto.symbol } },
      update: { contractAddr: dto.contractAddr, decimals: dto.decimals },
      create: {
        blockchainId: dto.blockchainId,
        symbol:       dto.symbol,
        name:         dto.name,
        decimals:     dto.decimals,
        contractAddr: dto.contractAddr,
        status:       "ACTIVE",
      },
    });
  }

  // ── Wallets ───────────────────────────────────────────────
  async getUserWallet(userId: string, chain?: string) {
    if (chain) return this.hdWallet.getOrCreateCustodialWallet(userId, chain);
    return this.hdWallet.getUserWallets(userId);
  }

  // ── Master Wallet ─────────────────────────────────────────
  async createMasterWallet(dto: CreateMasterWalletDto) {
    return this.hdWallet.createMasterWallet(dto.chain);
  }

  async getMasterWallet(chain: string) {
    return this.hdWallet.getMasterWallet(chain);
  }

  // ── Deposits ──────────────────────────────────────────────
  async getDeposits(userId: string) {
    return this.prisma.transaction.findMany({
      where:   { userId, type: "DEPOSIT" },
      orderBy: { createdAt: "desc" },
      take:    50,
    });
  }

  async confirmDeposit(txId: string) {
    return this.monitor.confirmDeposit(txId);
  }

  // ── Markets / Orders (DEX) ────────────────────────────────
  async getMarkets() {
    return this.prisma.ecoBlockchain.findMany({
      where:   { status: "ACTIVE" },
      include: { tokens: { where: { status: "ACTIVE" } } },
    });
  }
}
