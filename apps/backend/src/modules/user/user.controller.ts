import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { UserService } from "./user.service";

@ApiTags("user")
@Controller("api/user")
export class UserController {
  constructor(private userService: UserService) {}
}
