import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}
}
