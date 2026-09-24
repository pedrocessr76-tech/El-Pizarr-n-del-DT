import { Body, Controller, Get, Post, UseGuards, Request, Req, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { UnauthorizedException } from '@nestjs/common';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CsrfRefreshGuard } from './csrf-refresh.guard';
import { clearRefreshCookie, readCookie, REFRESH_COOKIE, setRefreshCookie } from './tokens';

class RegisterDto {
  @ApiProperty({ example: 'coach_javier', description: 'Nombre de usuario (3-15 caracteres)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  username!: string;

  @ApiProperty({ example: 'miPassword123', description: 'Contraseña' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password!: string;
}

class LoginDto {
  @ApiProperty({ example: 'coach_javier', description: 'Nombre de usuario' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  username!: string;

  @ApiProperty({ example: 'miPassword123', description: 'Contraseña' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password!: string;
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('guest')
  @ApiOperation({ summary: 'Crear una identidad anónima (invitado) y obtener su JWT' })
  async guest(@Res({ passthrough: true }) res: ExpressResponse) {
    const session = await this.authService.getGuestToken();
    setRefreshCookie(res, REFRESH_COOKIE, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const { refreshToken, ...session } = await this.authService.register(body.username, body.password);
    setRefreshCookie(res, REFRESH_COOKIE, refreshToken);
    return session;
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  @ApiBody({ type: LoginDto })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const { refreshToken, ...session } = await this.authService.login(body.username, body.password);
    setRefreshCookie(res, REFRESH_COOKIE, refreshToken);
    return session;
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @UseGuards(CsrfRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar la sesión con el refresh token en cookie HttpOnly' })
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: ExpressResponse) {
    const cookieRefresh = readCookie(req, REFRESH_COOKIE);
    if (!cookieRefresh) {
      throw new UnauthorizedException('No hay sesión activa.');
    }
    const { refreshToken, ...session } = await this.authService.refresh(cookieRefresh);
    setRefreshCookie(res, REFRESH_COOKIE, refreshToken);
    return session;
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('logout')
  @UseGuards(CsrfRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión: elimina la cookie de refresh' })
  logout(@Res({ passthrough: true }) res: ExpressResponse) {
    clearRefreshCookie(res, REFRESH_COOKIE);
    return { ok: true };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
