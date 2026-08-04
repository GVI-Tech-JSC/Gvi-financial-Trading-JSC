import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { SubmitKycDto, ReviewKycDto } from "./dto/kyc.dto";

@Injectable()
export class KycService {
  private readonly logger = new Logger(KycService.name);
  constructor(private prisma: PrismaService) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { kycLevel: true } });
    const app  = await this.prisma.kycApplication.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
    return { level: user?.kycLevel ?? 0, status: app?.status ?? "NONE", submittedAt: app?.submittedAt, rejectionReason: app?.rejectionReason };
  }

  async submit(userId: string, dto: SubmitKycDto) {
    const pending = await this.prisma.kycApplication.findFirst({ where: { userId, status: "PENDING" } });
    if (pending) throw new BadRequestException("You already have a pending application");
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { kycLevel: true } });
    return this.prisma.kycApplication.create({
      data: { userId, level: (user?.kycLevel ?? 0) + 1, status: "PENDING", fullName: dto.fullName, idType: dto.idType, idNumber: dto.idNumber, dob: dto.dob, nationality: dto.nationality, address: dto.address },
    });
  }

  async getApplications(status?: string) {
    return this.prisma.kycApplication.findMany({
      where: status ? { status: status as any } : {},
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" }, take: 100,
    });
  }

  async review(applicationId: string, dto: ReviewKycDto, adminId: string) {
    const app = await this.prisma.kycApplication.findUnique({ where: { id: applicationId } });
    if (!app) throw new NotFoundException("Application not found");
    if (app.status !== "PENDING") throw new BadRequestException("Application already reviewed");
    const updated = await this.prisma.kycApplication.update({
      where: { id: applicationId },
      data:  { status: dto.approved ? "APPROVED" : "REJECTED", rejectionReason: dto.rejectionReason, reviewedBy: adminId, reviewedAt: new Date() },
    });
    if (dto.approved) {
      await this.prisma.user.update({ where: { id: app.userId }, data: { kycLevel: { increment: 1 } } });
    }
    return updated;
  }

  async checkBlacklist(identifier: string) {
    return this.prisma.complianceBlacklist.findFirst({ where: { identifier } });
  }
}
