/**
 * VNKR Trade — Admin Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 */
import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { UpdateUserDto, AdjustWalletDto } from "./dto/admin.dto";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [totalUsers, activeUsers, pendingKyc, totalTx, pendingWithdraw, openOrders, openPositions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: "ACTIVE" } }),
      this.prisma.kycApplication.count({ where: { status: "PENDING" } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { type: "WITHDRAW", status: "PENDING" } }),
      this.prisma.exchangeOrder.count({ where: { status: "OPEN" } }),
      this.prisma.futuresPosition.count({ where: { status: "OPEN" } }),
    ]);
    return { users: { total: totalUsers, active: activeUsers }, kyc: { pending: pendingKyc }, transactions: { total: totalTx, pendingWithdraw }, trading: { openOrders, openPositions }, revenue: { total: 0 }, generatedAt: new Date() };
  }

  async getStats() { return this.getDashboard(); }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? { OR: [{ email: { contains: search } }, { firstName: { contains: search } }, { lastName: { contains: search } }] } : {};
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, select: { id: true, email: true, firstName: true, lastName: true, role: true, status: true, kycLevel: true, createdAt: true } }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return this.prisma.user.update({ where: { id }, data: dto as any });
  }

  async banUser(id: string, banned: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    const updated = await this.prisma.user.update({ where: { id }, data: { status: banned ? "BANNED" : "ACTIVE" } });
    await this.prisma.auditLog.create({ data: { userId: id, action: banned ? "BAN_USER" : "UNBAN_USER", entity: "User", entityId: id, newValue: { status: updated.status } } });
    return updated;
  }

  async adjustWallet(adminId: string, dto: AdjustWalletDto) {
    const { userId, currency, amount, reason } = dto;
    const wallet = await this.prisma.wallet.findFirst({ where: { userId, currency } });
    if (!wallet) throw new NotFoundException("Wallet not found");
    const updated = await this.prisma.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: new Decimal(amount) } } });
    await this.prisma.auditLog.create({ data: { userId: adminId, action: "ADJUST_WALLET", entity: "Wallet", entityId: wallet.id, newValue: { amount, reason, currency, targetUser: userId } } });
    return updated;
  }

  async getSettings() {
    return this.prisma.setting.findMany({ orderBy: { group: "asc" } });
  }

  async setSetting(key: string, value: string) {
    return this.prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
  }

  async getAuditLog(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({ skip, take: limit, orderBy: { createdAt: "desc" }, include: { user: { select: { email: true } } } }),
      this.prisma.auditLog.count(),
    ]);
    return { data, total, page, limit };
  }

  async getHealth() {
    try { await this.prisma.$queryRaw`SELECT 1`; return { status: "ok", db: "connected", uptime: process.uptime() }; }
    catch { return { status: "degraded", db: "disconnected", uptime: process.uptime() }; }
  }

  async getExtensions() { return []; }

  async getAnnouncements() { return []; }
}
