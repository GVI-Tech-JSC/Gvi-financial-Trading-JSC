import { Controller, Get, Put, Post, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard }  from "../../common/guards/jwt-auth.guard";
import { CurrentUser }   from "../../common/decorators/current-user.decorator";

@ApiTags("notifications")
@Controller("api/user/notification")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notifSvc: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Inbox thông báo" })
  getInbox(@CurrentUser() user: any) { return this.notifSvc.getInbox(user.sub); }

  @Get("unread")
  @ApiOperation({ summary: "Số thông báo chưa đọc" })
  getUnread(@CurrentUser() user: any) { return this.notifSvc.getUnreadCount(user.sub); }

  @Put(":id/read")
  @ApiOperation({ summary: "Đánh dấu đã đọc" })
  markRead(@CurrentUser() user: any, @Param("id") id: string) {
    return this.notifSvc.markRead(user.sub, id);
  }

  @Put("read-all")
  @ApiOperation({ summary: "Đánh dấu tất cả đã đọc" })
  markAllRead(@CurrentUser() user: any) { return this.notifSvc.markAllRead(user.sub); }
}
