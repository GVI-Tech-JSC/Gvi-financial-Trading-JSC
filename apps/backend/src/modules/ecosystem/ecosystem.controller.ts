import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { EcosystemService } from "./ecosystem.service";

@ApiTags("ecosystem")
@Controller("api/ecosystem")
export class EcosystemController {
  constructor(private ecosystemService: EcosystemService) {}
}
