import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { authenticator } from "otplib";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto }    from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma:  PrismaService,
    private jwt:     JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException("Email already registered");
    const hash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: { email: dto.email, password: hash, firstName: dto.firstName, lastName: dto.lastName },
    });
    return this.signTokens(user.id, user.email, user.role);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) throw new UnauthorizedException("Invalid credentials");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException("Invalid credentials");
    if (user.status === "BANNED" || user.status === "SUSPENDED")
      throw new UnauthorizedException("Account suspended");
    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (user.twoFactorEnabled) {
      if (!dto.otpCode) return { requiresTwoFactor: true };
      const valid = authenticator.verify({ token: dto.otpCode, secret: user.twoFactorSecret });
      if (!valid) throw new UnauthorizedException("Invalid 2FA code");
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    return this.signTokens(user.id, user.email, user.role);
  }

  async enable2fa(userId: string) {
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorSecret: secret } });
    const otpAuthUrl = authenticator.keyuri(userId, "VNKR Trade", secret);
    return { secret, otpAuthUrl };
  }

  async verify2fa(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.twoFactorSecret) throw new BadRequestException("2FA not initiated");
    const valid = authenticator.verify({ token, secret: user.twoFactorSecret });
    if (!valid) throw new UnauthorizedException("Invalid 2FA code");
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
    return { enabled: true };
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.signTokens(user.id, user.email, user.role);
  }

  private signTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken  = this.jwt.sign(payload, { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '30m') as any });
    const refreshToken = this.jwt.sign(payload, { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '14d') as any });
    return { accessToken, refreshToken, tokenType: "Bearer" };
  }
}
