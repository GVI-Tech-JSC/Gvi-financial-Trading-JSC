/**
 * VNKR Trade — Notifications Service
 * Author: NGUYEN THI THU HUONG | GVI Tech JSC
 * Channels: IN_APP, EMAIL, SMS, PUSH
 */
import { Injectable, Logger } from "@nestjs/common";
import { PrismaService }  from "../../prisma/prisma.service";
import * as nodemailer    from "nodemailer";
import { Decimal }        from "@prisma/client/runtime/library";

export interface SendNotifDto {
  userId:   string;
  title:    string;
  message:  string;
  channel?: "IN_APP" | "EMAIL" | "SMS" | "PUSH";
  metadata?: any;
}

@Injectable()
export class NotificationsService {
  private readonly logger    = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private prisma: PrismaService) {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST,
        port:   Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  // ── Send notification ────────────────────────────────────────
  async send(dto: SendNotifDto) {
    const channel = dto.channel ?? "IN_APP";

    // Always persist to DB
    const notif = await this.prisma.notification.create({
      data: {
        userId:   dto.userId,
        channel:  channel as any,
        title:    dto.title,
        message:  dto.message,
        metadata: dto.metadata ?? {},
      },
    });

    // Send via channel
    if (channel === "EMAIL") await this.sendEmail(dto);
    if (channel === "PUSH")  await this.sendPush(dto);

    return notif;
  }

  async sendBulk(userIds: string[], title: string, message: string) {
    await this.prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId, title, message, channel: "IN_APP" as any,
      })),
    });
    this.logger.log(`Bulk notification sent to ${userIds.length} users`);
  }

  // ── User inbox ───────────────────────────────────────────────
  async getInbox(userId: string) {
    return this.prisma.notification.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    50,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data:  { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data:  { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  // ── Email via Nodemailer ──────────────────────────────────────
  private async sendEmail(dto: SendNotifDto) {
    if (!this.transporter) return;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.userId }, select: { email: true, firstName: true },
      });
      if (!user?.email) return;

      await this.transporter.sendMail({
        from:    process.env.SMTP_FROM ?? "noreply@vnkr.vn",
        to:      user.email,
        subject: dto.title,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h1 style="color:#3b82d4;font-size:20px">VNKR Trade</h1>
            <p>Xin chào${user.firstName ? " " + user.firstName : ""},</p>
            <div style="background:#f7f8fa;border-radius:8px;padding:16px;margin:16px 0">
              <h2 style="font-size:16px;margin:0 0 8px">${dto.title}</h2>
              <p style="margin:0;color:#57606a">${dto.message}</p>
            </div>
            <p style="color:#57606a;font-size:12px;margin-top:24px">
              GVI Tech JSC · vnkr.vn<br>
              Author: NGUYEN THI THU HUONG
            </p>
          </div>
        `,
      });
      this.logger.log(`Email sent to ${user.email}`);
    } catch (e: any) {
      this.logger.warn(`Email send error: ${e.message}`);
    }
  }

  private async sendPush(_dto: SendNotifDto) {
    // Web Push implementation (web-push library)
    // TODO: integrate web-push with VAPID keys
    this.logger.debug("Push notification queued (web-push TODO)");
  }

  // ── Templates ─────────────────────────────────────────────────
  async getTemplates() {
    return this.prisma.notificationTemplate.findMany();
  }

  async sendFromTemplate(userId: string, templateName: string, vars: Record<string, string> = {}) {
    const tmpl = await this.prisma.notificationTemplate.findUnique({
      where: { name: templateName },
    });
    if (!tmpl) return null;

    let body = tmpl.body;
    Object.entries(vars).forEach(([k, v]) => {
      body = body.replace(new RegExp(`{{${k}}}`, "g"), v);
    });

    return this.send({
      userId,
      title:   tmpl.subject ?? tmpl.name,
      message: body,
      channel: tmpl.channel,
    });
  }
}
