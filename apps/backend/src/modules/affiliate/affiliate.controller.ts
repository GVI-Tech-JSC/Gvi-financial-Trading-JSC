import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AffiliateService } from "./affiliate.service";

@ApiTags("affiliate")
@Controller("api/affiliate")
export class AffiliateController {
  constructor(private affiliateService: AffiliateService) {}
}
