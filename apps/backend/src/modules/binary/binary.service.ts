import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BinaryService {
  constructor(private prisma: PrismaService) {}
}
