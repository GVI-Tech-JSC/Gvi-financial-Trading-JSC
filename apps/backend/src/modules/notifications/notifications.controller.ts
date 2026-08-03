import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("api/notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}
}
