import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class LearnService {
  constructor(private prisma: PrismaService) {}
}
