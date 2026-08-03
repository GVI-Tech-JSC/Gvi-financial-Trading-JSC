import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { DexService } from "./dex.service";

@ApiTags("dex")
@Controller("api/dex")
export class DexController {
  constructor(private dexService: DexService) {}
}
