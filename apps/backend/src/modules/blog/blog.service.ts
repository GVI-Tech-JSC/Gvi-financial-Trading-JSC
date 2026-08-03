import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}
}
