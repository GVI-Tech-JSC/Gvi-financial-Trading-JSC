import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FuturesService {
  constructor(private prisma: PrismaService) {}
}
