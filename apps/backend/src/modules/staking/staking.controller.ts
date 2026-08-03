import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StakingService } from "./staking.service";

@ApiTags("staking")
@Controller("api/staking")
export class StakingController {
  constructor(private stakingService: StakingService) {}
}
