import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ExchangeService {
  constructor(private prisma: PrismaService) {}
}
