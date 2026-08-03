import { Controller, Post, Get, Body, Req, UseGuards, Delete, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AuthService }   from "./auth.service";
import { RegisterDto }   from "./dto/register.dto";
import { LoginDto }      from "./dto/login.dto";
import { JwtAuthGuard }  from "../../common/guards/jwt-auth.guard";
import { CurrentUser }   from "../../common/decorators/current-user.decorator";

@ApiTags("auth")
@Controller("api/auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Đăng ký tài khoản" })
  register(@Body() dto: RegisterDto) { return this.authService.register(dto); }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đăng nhập" })
  login(@Body() dto: LoginDto) { return this.authService.login(dto); }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Đăng xuất" })
  logout() { return { message: "Logged out" }; }

  @Get("session")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Lấy session hiện tại" })
  session(@CurrentUser() user: any) { return user; }

  @Post("otp/enable")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bật 2FA — lấy QR code" })
  enable2fa(@CurrentUser() user: any) { return this.authService.enable2fa(user.sub); }

  @Post("otp/verify")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xác thực mã 2FA" })
  verify2fa(@CurrentUser() user: any, @Body("code") code: string) {
    return this.authService.verify2fa(user.sub, code);
  }

  @Delete("delete")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Xóa tài khoản" })
  deleteAccount(@CurrentUser() user: any) {
    return { message: "Account deletion requested", userId: user.sub };
  }
}
