import { Injectable, Logger } from "@nestjs/common";
import { PrismaService }      from "../../../prisma/prisma.service";

@Injectable()
export class HdWalletService {
  private readonly logger = new Logger(HdWalletService.name);
  constructor(private prisma: PrismaService) {}

  async getOrCreateUserWallet(userId: string, network = "BSC") {
    const existing = await this.prisma.ecoWallet.findUnique({ where: { userId } });
    if (existing) return existing;
    // Deterministic address derivation (mock — in prod use ethers HDNode)
    const index   = await this.prisma.ecoWallet.count();
    const address = `0x${Buffer.from(userId + index).toString("hex").padEnd(40, "0").slice(0, 40)}`;
    return this.prisma.ecoWallet.create({ data: { userId, address, network, index } });
  }

  async getUserWallet(userId: string) {
    return this.prisma.ecoWallet.findUnique({ where: { userId } });
  }
}
