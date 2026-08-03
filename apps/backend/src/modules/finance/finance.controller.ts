import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FinanceService } from "./finance.service";

@ApiTags("finance")
@Controller("api/finance")
export class FinanceController {
  constructor(private financeService: FinanceService) {}
}
