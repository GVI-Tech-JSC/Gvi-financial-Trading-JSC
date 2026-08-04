/**
 * VNKR Trade — Deposit Monitor Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Polls EVM RPC for incoming transactions to custodial wallets
 */
import { Injectable, Logger } from "@nestjs/common";
import { Cron }               from "@nestjs/schedule";
import { PrismaService }      from "../../../prisma/prisma.service";
import { ethers }             from "ethers";
import { Decimal }            from "@prisma/client/runtime/library";

@Injectable()
export class DepositMonitorService {
  private readonly logger   = new Logger(DepositMonitorService.name);
  private providers         = new Map<string, ethers.JsonRpcProvider>();

  constructor(private prisma: PrismaService) {}

  private getProvider(chain: string): ethers.JsonRpcProvider | null {
    if (this.providers.has(chain)) return this.providers.get(chain)!;
    const rpcUrl = process.env[`RPC_URL_${chain.toUpperCase()}`];
    if (!rpcUrl) return null;
    const p = new ethers.JsonRpcProvider(rpcUrl);
    this.providers.set(chain, p);
    return p;
  }

  /** Check for new deposits every 30 seconds */
  @Cron("*/30 * * * * *")
  async scanDeposits() {
    try {
      const blockchains = await this.prisma.ecoBlockchain.findMany({
        where: { status: "ACTIVE", type: "EVM" },
      });
      for (const bc of blockchains) {
        await this.scanChain(bc.symbol, bc.rpcUrl ?? "");
      }
    } catch (e: any) {
      this.logger.warn(`Deposit scan error: ${e.message}`);
    }
  }

  private async scanChain(chain: string, rpcUrl: string) {
    if (!rpcUrl) return;
    let provider = this.providers.get(chain);
    if (!provider) {
      provider = new ethers.JsonRpcProvider(rpcUrl);
      this.providers.set(chain, provider);
    }

    try {
      const blockNumber = await provider.getBlockNumber();
      const wallets     = await this.prisma.ecoCustodialWallet.findMany({
        where: { chain, status: true },
        take:  100,
      });

      for (const w of wallets) {
        const balance = await provider.getBalance(w.address);
        const ethBal  = parseFloat(ethers.formatEther(balance));

        // Simple heuristic: if balance > 0 and no pending tx, create deposit
        if (ethBal > 0.001) {
          const existing = await this.prisma.transaction.findFirst({
            where: {
              userId:  w.userId,
              type:    "DEPOSIT",
              status:  "COMPLETED",
              metadata: { path: ["address"], equals: w.address },
            },
          });

          if (!existing) {
            await this.prisma.transaction.create({
              data: {
                userId:   w.userId,
                type:     "DEPOSIT",
                status:   "PENDING",
                currency: chain,
                amount:   new Decimal(ethBal),
                metadata: { address: w.address, chain, blockNumber },
              },
            });
            this.logger.log(
              `Deposit detected: ${w.userId} ${ethBal} ${chain} @ ${w.address}`
            );
          }
        }
      }
    } catch (e: any) {
      this.logger.warn(`Chain scan [${chain}] error: ${e.message}`);
    }
  }

  async confirmDeposit(txId: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { id: txId } });
    if (!tx) return null;

    await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: txId },
        data:  { status: "COMPLETED" },
      }),
      this.prisma.wallet.updateMany({
        where: { userId: tx.userId, type: "ECO", currency: tx.currency },
        data:  { balance: { increment: Number(tx.amount) } },
      }),
    ]);

    return { confirmed: true };
  }
}
