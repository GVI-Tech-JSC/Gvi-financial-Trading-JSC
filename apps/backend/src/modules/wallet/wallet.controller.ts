import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { WalletService } from "./wallet.service";

@ApiTags("wallet")
@Controller("api/wallet")
export class WalletController {
  constructor(private walletService: WalletService) {}
}
