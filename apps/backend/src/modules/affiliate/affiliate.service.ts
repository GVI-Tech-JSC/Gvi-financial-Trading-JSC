import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AffiliateService {
  constructor(private prisma: PrismaService) {}
}
