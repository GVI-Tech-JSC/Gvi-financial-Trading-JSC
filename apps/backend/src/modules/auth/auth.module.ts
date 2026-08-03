import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService }       from "./auth.service";
import { AuthController }    from "./auth.controller";
import { JwtStrategy }       from "./strategies/jwt.strategy";
import { LocalStrategy }     from "./strategies/local.strategy";
import { GoogleStrategy }    from "./strategies/google.strategy";
import { UserModule }        from "../user/user.module";

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret:      process.env.JWT_SECRET || "dev-secret",
        signOptions: { expiresIn: process.env.JWT_ACCESS_EXPIRES || "30m" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers:   [AuthService, JwtStrategy, LocalStrategy, GoogleStrategy],
  exports:     [AuthService],
})
export class AuthModule {}
