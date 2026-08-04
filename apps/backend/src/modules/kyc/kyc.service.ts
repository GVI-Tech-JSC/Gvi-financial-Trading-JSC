/**
 * VNKR Trade — KYC Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { SubmitKycDto, ReviewKycDto } from "./dto/kyc.dto";

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);

  constructor(private prisma: PrismaService) {}

  async getLevels() {
    return this.prisma.kycLevel.findMany({ orderBy: { id: "asc" } });
  }

  async getUserLevel(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { kycLevel: true },
    });
    const levels = await this.prisma.kycLevel.findMany();
    return { currentLevel: user?.kycLevel ?? 0, levels };
  }

  async getApplication(userId: string) {
    return this.prisma.kycApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async submitApplication(userId: string, dto: SubmitKycDto) {
    // Check for pending application
    const pending = await this.prisma.kycApplication.findFirst({
      where: { userId, status: { in: ["PENDING", "REVIEWING"] } },
    });
    if (pending) throw new BadRequestException("You already have a pending KYC application");

    return this.prisma.kycApplication.create({
      data: {
        userId,
        level:  dto.level,
        status: "PENDING",
        documents: {
          type:     dto.documentType,
          frontUrl: dto.frontUrl,
          backUrl:  dto.backUrl,
          selfieUrl:dto.selfieUrl,
        },
        notes: dto.notes,
      },
    });
  }

  // ── Admin operations ─────────────────────────────────────────
  async listApplications(status?: string) {
    return this.prisma.kycApplication.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async reviewApplication(id: string, reviewerId: string, dto: ReviewKycDto) {
    const app = await this.prisma.kycApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException("KYC application not found");
    if (app.status !== "PENDING" && app.status !== "REVIEWING")
      throw new BadRequestException("Application already processed");

    await this.prisma.$transaction(async (tx) => {
      await tx.kycApplication.update({
        where: { id },
        data: {
          status:     dto.status as any,
          notes:      dto.reason,
          reviewedAt: new Date(),
          reviewedBy: reviewerId,
        },
      });
      // If approved, update user KYC level
      if (dto.status === "APPROVED") {
        await tx.user.update({
          where: { id: app.userId },
          data:  { kycLevel: app.level },
        });
      }
    });

    this.logger.log(`KYC ${id} ${dto.status} by ${reviewerId}`);
    return { id, status: dto.status };
  }

  // ── AML Screening ────────────────────────────────────────────
  async checkAml(userId: string) {
    const screening = await this.prisma.amlScreening.findFirst({
      where: { userId },
      orderBy: { screenedAt: "desc" },
    });
    // Check blacklist
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { email: true, walletAddress: true },
    });
    const blacklisted = user?.email
      ? await this.prisma.blacklistEntry.findFirst({
          where: { type: "EMAIL", value: user.email },
        })
      : null;

    return {
      userId,
      riskScore: screening?.riskScore ?? 0,
      riskLevel: screening?.riskLevel ?? "LOW",
      blacklisted: !!blacklisted,
      screenedAt: screening?.screenedAt ?? null,
    };
  }
}
