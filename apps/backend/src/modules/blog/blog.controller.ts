import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BlogService } from "./blog.service";

@ApiTags("blog")
@Controller("api/blog")
export class BlogController {
  constructor(private blogService: BlogService) {}
}
