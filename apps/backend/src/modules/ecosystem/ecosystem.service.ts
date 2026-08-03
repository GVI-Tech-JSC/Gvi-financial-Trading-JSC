import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class EcosystemService {
  constructor(private prisma: PrismaService) {}
}
