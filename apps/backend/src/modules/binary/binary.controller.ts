import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BinaryService } from "./binary.service";

@ApiTags("binary")
@Controller("api/binary")
export class BinaryController {
  constructor(private binaryService: BinaryService) {}
}
