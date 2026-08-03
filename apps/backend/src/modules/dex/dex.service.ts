import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DexService {
  constructor(private prisma: PrismaService) {}
}
