import { Controller, Get, Post, Patch, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard }       from "../../common/guards/jwt-auth.guard";
import { CurrentUser }        from "../../common/decorators/current-user.decorator";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifSvc: NotificationsService) {}
  @Get()           getAll(@CurrentUser() u: any)                               { return this.notifSvc.getForUser(u.sub); }
  @Get("unread")   getUnread(@CurrentUser() u: any)                           { return this.notifSvc.getForUser(u.sub, true); }
  @Patch(":id/read") markRead(@Param("id") id: string, @CurrentUser() u: any){ return this.notifSvc.markRead(id, u.sub); }
  @Post("read-all") markAllRead(@CurrentUser() u: any)                        { return this.notifSvc.markAllRead(u.sub); }
}
