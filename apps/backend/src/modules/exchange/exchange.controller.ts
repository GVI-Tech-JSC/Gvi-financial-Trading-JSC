import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ExchangeService } from "./exchange.service";

@ApiTags("exchange")
@Controller("api/exchange")
export class ExchangeController {
  constructor(private exchangeService: ExchangeService) {}
}
