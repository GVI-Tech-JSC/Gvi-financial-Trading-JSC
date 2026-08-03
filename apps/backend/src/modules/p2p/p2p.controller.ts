import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { P2pService } from "./p2p.service";

@ApiTags("p2p")
@Controller("api/p2p")
export class P2pController {
  constructor(private p2pService: P2pService) {}
}
