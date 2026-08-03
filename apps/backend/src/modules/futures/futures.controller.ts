import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FuturesService } from "./futures.service";

@ApiTags("futures")
@Controller("api/futures")
export class FuturesController {
  constructor(private futuresService: FuturesService) {}
}
