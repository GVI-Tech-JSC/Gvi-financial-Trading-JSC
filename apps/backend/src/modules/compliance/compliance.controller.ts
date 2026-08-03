import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ComplianceService } from "./compliance.service";

@ApiTags("compliance")
@Controller("api/compliance")
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}
}
