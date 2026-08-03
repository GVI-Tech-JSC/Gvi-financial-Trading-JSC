import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AdminService } from "./admin.service";

@ApiTags("admin")
@Controller("api/admin")
export class AdminController {
  constructor(private adminService: AdminService) {}
}
