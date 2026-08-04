/**
 * VNKR Trade — HD Wallet Service (BIP44 / BIP32)
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Uses ethers.js v6 (MIT) — generates custodial wallets for users
 */
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ethers }        from "ethers";

@Injectable()
export class HdWalletService {
  private readonly logger = new Logger(HdWalletService.name);

  constructor(private prisma: PrismaService) {}

  // ── Master Wallet (xpub only stored — private key in KMS/env) ──
  async createMasterWallet(chain: string): Promise<{ address: string; xpub: string }> {
    const existing = await this.prisma.ecoMasterWallet.findUnique({ where: { chain } });
    if (existing) return { address: existing.address, xpub: existing.xpub ?? "" };

    // Generate HD wallet from mnemonic (in prod: use KMS)
    const mnemonic  = process.env[`HD_MNEMONIC_${chain.toUpperCase()}`]
      ?? ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
    const hdNode    = ethers.HDNodeWallet.fromPhrase(mnemonic);
    const xpub      = hdNode.neuter().extendedKey;
    const address   = hdNode.address;

    await this.prisma.ecoMasterWallet.create({
      data: { chain, address, xpub, status: true },
    });

    this.logger.log(`Master wallet created for ${chain}: ${address}`);
    return { address, xpub };
  }

  async getMasterWallet(chain: string) {
    const w = await this.prisma.ecoMasterWallet.findUnique({ where: { chain } });
    if (!w) throw new NotFoundException(`No master wallet for chain ${chain}`);
    // Never return private data in response
    return { chain: w.chain, address: w.address, status: w.status };
  }

  // ── Custodial Wallet (per-user, per-chain, BIP44 derived) ──
  async getOrCreateCustodialWallet(userId: string, chain: string) {
    const existing = await this.prisma.ecoCustodialWallet.findFirst({
      where: { userId, chain },
    });
    if (existing) return { address: existing.address, chain };

    // Derive address deterministically from master + userId index
    const master = await this.prisma.ecoMasterWallet.findUnique({ where: { chain } });
    if (!master?.xpub) {
      // Fallback: generate a random wallet for dev
      const wallet  = ethers.Wallet.createRandom();
      await this.prisma.ecoCustodialWallet.create({
        data: { userId, address: wallet.address, chain, publicKey: wallet.publicKey },
      });
      return { address: wallet.address, chain };
    }

    // Derive child from xpub (index = hash of userId)
    const index   = parseInt(userId.replace(/-/g, "").slice(0, 8), 16) % 100000000;
    const hdNode  = ethers.HDNodeWallet.fromExtendedKey(master.xpub);
    const child   = hdNode.deriveChild(index);
    const address = child.address;
    const pubKey  = child.publicKey;

    await this.prisma.ecoCustodialWallet.create({
      data: { userId, address, chain, publicKey: pubKey },
    });

    this.logger.log(`Custodial wallet [${chain}] created for ${userId}: ${address}`);
    return { address, chain };
  }

  async getUserWallets(userId: string) {
    return this.prisma.ecoCustodialWallet.findMany({
      where: { userId },
      select: { id: true, address: true, chain: true, status: true },
    });
  }
}
