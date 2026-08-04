/**
 * VNKR Trade — Admin Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Routes bám sát API_ROUTE_MAP §5 ADMIN + §12 ADMIN ROUTES
 */
import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import { Decimal }        from "@prisma/client/runtime/library";
import { UpdateUserDto, AdjustWalletDto } from "./dto/admin.dto";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

  // ── Dashboard KPIs ───────────────────────────────────────────
  async getDashboard() {
    const [
      totalUsers, activeUsers, pendingKyc,
      totalTx, pendingWithdraw,
      openOrders, openPositions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: "ACTIVE" } }),
      this.prisma.kycApplication.count({ where: { status: "PENDING" } }),
      this.prisma.transaction.count(),
      this.prisma.transaction.count({ where: { type: "WITHDRAW", status: "PENDING" } }),
      this.prisma.exchangeOrder.count({ where: { status: "OPEN" } }),
      this.prisma.futuresPosition.count({ where: { status: "OPEN" } }),
    ]);

    const revenue = await this.prisma.adminProfit.aggregate({
      _sum: { amount: true },
    });

    return {
      users:          { total: totalUsers, active: activeUsers },
      kyc:            { pending: pendingKyc },
      transactions:   { total: totalTx, pendingWithdraw },
      trading:        { openOrders, openPositions },
      revenue:        { total: Number(revenue._sum.amount ?? 0) },
      generatedAt:    new Date(),
    };
  }

  async getStats() {
    return this.getDashboard();
  }

  // ── Activity Feed ────────────────────────────────────────────
  async getActivity(limit = 50) {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take:    limit,
      include: { user: { select: { email: true, firstName: true } } },
    });
  }

  // ── User Management ──────────────────────────────────────────
  async getUsers(params: {
    page?: number; limit?: number; search?: string; status?: string; role?: string;
  }) {
    const { page = 1, limit = 20, search, status, role } = params;
    const skip  = (page - 1) * limit;
    const where: any = {
      ...(status ? { status } : {}),
      ...(role   ? { role   } : {}),
      ...(search ? {
        OR: [
          { email:     { contains: search } },
          { firstName: { contains: search } },
          { lastName:  { contains: search } },
        ],
      } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, status: true, kycLevel: true,
          emailVerified: true, lastLogin: true, createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallets:        true,
        kycApplications:{ orderBy: { createdAt: "desc" }, take: 3 },
        transactions:   { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto, adminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
        ...(dto.lastName  !== undefined ? { lastName:  dto.lastName  } : {}),
        ...(dto.role      !== undefined ? { role:      dto.role      } : {}),
        ...(dto.status    !== undefined ? { status:    dto.status as any } : {}),
        ...(dto.kycLevel  !== undefined ? { kycLevel:  dto.kycLevel  } : {}),
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId:   adminId,
        action:   "UPDATE_USER",
        entity:   "User",
        entityId: id,
        after:    dto as any,
      },
    });
    return updated;
  }

  async banUser(id: string, adminId: string) {
    await this.prisma.user.update({
      where: { id },
      data:  { status: "BANNED" },
    });
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: "BAN_USER", entity: "User", entityId: id },
    });
    return { banned: true };
  }

  async getUserSessions(userId: string) {
    return this.prisma.loginSession.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    10,
    });
  }

  async revokeUserSessions(userId: string) {
    await this.prisma.loginSession.deleteMany({ where: { userId } });
    return { revoked: true };
  }

  // ── Finance Admin ────────────────────────────────────────────
  async getTransactions(params: {
    page?: number; limit?: number; type?: string; status?: string; userId?: string;
  }) {
    const { page = 1, limit = 30, type, status, userId } = params;
    const where: any = {
      ...(type   ? { type:   type as any   } : {}),
      ...(status ? { status: status as any } : {}),
      ...(userId ? { userId }               : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where, skip: (page-1)*limit, take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.transaction.count({ where }),
    ]);
    return { items, total, page, pageSize: limit };
  }

  async getProfit() {
    const records = await this.prisma.adminProfit.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const total = await this.prisma.adminProfit.aggregate({ _sum: { amount: true } });
    return { records, totalProfit: Number(total._sum.amount ?? 0) };
  }

  async adjustWallet(dto: AdjustWalletDto, adminId: string) {
    const amount = parseFloat(dto.amount);
    const isCredit = amount > 0;
    await this.prisma.wallet.updateMany({
      where: { userId: dto.userId, type: dto.type as any, currency: dto.currency },
      data:  { balance: isCredit ? { increment: Math.abs(amount) } : { decrement: Math.abs(amount) } },
    });
    await this.prisma.transaction.create({
      data: {
        userId:      dto.userId,
        type:        "TRANSFER",
        status:      "COMPLETED",
        currency:    dto.currency,
        amount:      new Decimal(Math.abs(amount)),
        description: `Admin adjustment: ${dto.reason}`,
      },
    });
    await this.prisma.auditLog.create({
      data: {
        userId: adminId, action: "ADJUST_WALLET",
        entity: "Wallet", entityId: dto.userId,
        after: dto as any,
      },
    });
    return { adjusted: true };
  }

  // ── System ───────────────────────────────────────────────────
  async getSettings() {
    return this.prisma.setting.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] });
  }

  async updateSettings(settings: Record<string, any>, adminId: string) {
    const ops = Object.entries(settings).map(([key, value]) =>
      this.prisma.setting.upsert({
        where:  { key },
        update: { value },
        create: { key, value, group: "general" },
      })
    );
    await Promise.all(ops);
    await this.prisma.auditLog.create({
      data: { userId: adminId, action: "UPDATE_SETTINGS", entity: "Setting", after: settings },
    });
    return { updated: Object.keys(settings).length };
  }

  async getAuditLog(page = 1, limit = 50) {
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip: (page-1)*limit, take: limit,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page };
  }

  async getExtensions() {
    return this.prisma.extension.findMany({ orderBy: { name: "asc" } });
  }

  async updateExtension(id: string, status: string) {
    return this.prisma.extension.update({
      where: { id },
      data:  { status: status as any },
    });
  }

  async getHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "connected", timestamp: new Date() };
    } catch {
      return { status: "degraded", db: "error", timestamp: new Date() };
    }
  }

  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      where:   { isActive: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async createAnnouncement(data: { title: string; content: string; type?: string }) {
    return this.prisma.announcement.create({ data: { ...data, isActive: true } });
  }
}
