import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService }     from "../../prisma/prisma.service";
import { HdWalletService }   from "./services/hd-wallet.service";
import { CreateTokenDto, CreateBlockchainDto } from "./dto/ecosystem.dto";

@Injectable()
export class EcosystemService {
  private readonly logger = new Logger(EcosystemService.name);
  constructor(private prisma: PrismaService, private hdWallet: HdWalletService) {}

  async getBlockchains() {
    return this.prisma.ecoBlockchain.findMany({ where: { status: "ACTIVE" }, include: { tokens: true } });
  }

  async getTokens(blockchainId?: string) {
    return this.prisma.ecoToken.findMany({ where: { ...(blockchainId ? { blockchainId } : {}), status: "ACTIVE" }, include: { blockchain: true } });
  }

  async createBlockchain(dto: CreateBlockchainDto) {
    return this.prisma.ecoBlockchain.create({ data: dto as any });
  }

  async createToken(dto: CreateTokenDto) {
    return this.prisma.ecoToken.create({ data: { ...dto, contractAddress: dto.contractAddress } as any });
  }

  async getUserWallet(userId: string) {
    return this.hdWallet.getOrCreateUserWallet(userId);
  }

  async getDepositAddress(userId: string, currency: string, network: string) {
    const wallet = await this.hdWallet.getOrCreateUserWallet(userId, network);
    return { address: wallet.address, currency, network, memo: null };
  }

  async getNetworkFee(network: string) {
    const fees: Record<string,number> = { BSC: 0.0005, ETH: 0.005, TRON: 1 };
    return { network, estimatedFee: fees[network] ?? 0.001, currency: "native" };
  }
}
