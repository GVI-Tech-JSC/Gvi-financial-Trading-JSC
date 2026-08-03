import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { LearnService } from "./learn.service";

@ApiTags("learn")
@Controller("api/learn")
export class LearnController {
  constructor(private learnService: LearnService) {}
}
