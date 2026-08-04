import { Injectable, Logger } from "@nestjs/common";
import { PrismaService }     from "../../prisma/prisma.service";
import * as nodemailer       from "nodemailer";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private prisma: PrismaService) {
    this.transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST ?? "smtp.gmail.com",
      port:   parseInt(process.env.SMTP_PORT ?? "587"),
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }

  async send(userId: string, title: string, message: string, channel = "IN_APP", type = "INFO") {
    const notif = await this.prisma.notification.create({
      data: { userId, title, message, channel: channel as any, type, isRead: false },
    });
    if (channel === "EMAIL") { this.sendEmail(userId, title, message).catch(() => {}); }
    return notif;
  }

  async sendBulk(userIds: string[], title: string, message: string) {
    const records = userIds.map(userId => ({ userId, title, message, channel: "IN_APP" as any, type: "INFO", isRead: false }));
    return this.prisma.notification.createMany({ data: records });
  }

  async getForUser(userId: string, unreadOnly = false) {
    return this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: "desc" }, take: 50,
    });
  }

  async markRead(notifId: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { id: notifId, userId }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
  }

  private async sendEmail(userId: string, subject: string, text: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email || !process.env.SMTP_USER) return;
    await this.transporter.sendMail({ from: process.env.SMTP_USER, to: user.email, subject, text });
  }
}
