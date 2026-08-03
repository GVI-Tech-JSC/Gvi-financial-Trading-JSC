import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { WebhooksService } from "./webhooks.service";

@ApiTags("webhooks")
@Controller("api/webhooks")
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}
}
