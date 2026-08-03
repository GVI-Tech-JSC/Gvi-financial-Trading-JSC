import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ReferralService } from "./referral.service";

@ApiTags("referral")
@Controller("api/referral")
export class ReferralController {
  constructor(private referralService: ReferralService) {}
}
