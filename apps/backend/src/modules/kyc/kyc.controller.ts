import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { KycService } from "./kyc.service";

@ApiTags("kyc")
@Controller("api/kyc")
export class KycController {
  constructor(private kycService: KycService) {}
}
