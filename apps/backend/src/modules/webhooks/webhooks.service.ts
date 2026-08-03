import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) {}
}
