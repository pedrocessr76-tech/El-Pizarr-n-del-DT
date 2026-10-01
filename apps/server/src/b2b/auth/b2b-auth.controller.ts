import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { B2bJwtGuard } from './b2b-jwt.guard';
import { CurrentB2bUser } from './b2b-auth.decorators';
import { B2bAuthService } from './b2b-auth.service';
import { B2bJwtUser } from './b2b-auth.types';
import { CsrfRefreshGuard } from '../../auth/csrf-refresh.guard';
import { B2B_REFRESH_COOKIE, clearRefreshCookie, readCookie, setRefreshCookie } from '../../auth/tokens';
import { B2bRolesGuard } from './b2b-roles.guard';
import { B2bRoles } from './b2b-auth.decorators';
import { B2bRoleCode } from '../entities/b2b.enums';

class OnboardingDto {
  @ApiProperty({ example: 'Complejo Los Amigos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  organizationName!: string;

  @ApiProperty({ example: 'Sede Central', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  facilityName?: string;

  @ApiProperty({ example: 'Carlos Bianchi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  ownerFullName!: string;

  @ApiProperty({ example: 'dueno@complejo.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'claveSegura123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  password!: string;
}

class RegisterClientDto {
  @ApiProperty({ example: 'cliente@correo.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Martina López' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({ example: 'claveSegura123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

class LoginB2bDto {
  @ApiProperty({ example: 'cliente@correo.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'claveSegura123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  password!: string;
}

class VerifyEmailDto {
  @ApiProperty({ required: false, example: 'a1b2c3…', description: 'Token de 64 hex. Opcional si viene por query en el enlace del email.' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  token?: string;
}

class ResendVerificationDto {
  @ApiProperty({ example: 'pedrocessr76@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

class UpdateProfileDto {
  @ApiProperty({ required: false, example: '+5491112345678', description: 'WhatsApp en formato internacional (E.164). Vacío desactiva el contacto.' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsappPhone?: string;

  @ApiProperty({ required: false, example: true, description: 'Consentimiento explícito para recibir mensajes por WhatsApp.' })
  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
}

class UpdateOrganizationContactDto {
  @ApiProperty({ required: false, example: '+5491112345678', description: 'WhatsApp del complejo en formato internacional (E.164).' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  whatsappPhone?: string;

  @ApiProperty({ required: false, example: true, description: 'Consentimiento explícito del complejo para avisos por WhatsApp.' })
  @IsOptional()
  @IsBoolean()
  whatsappOptIn?: boolean;
}

@Controller('api/v1/auth')
@ApiTags('B2B Auth')
export class B2bAuthController {
  constructor(private readonly auth: B2bAuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('onboarding')
  @ApiOperation({ summary: 'Onboarding de propietario: crea el complejo, su cuenta OWNER (sin sesión, hay que verificar el email) y una sede inicial opcional' })
  async onboarding(@Body() body: OnboardingDto) {
    // Sin cookie de refresh: la cuenta nace sin verificar y no hay sesión hasta
    // confirmar el email (#verificacion-de-email).
    return this.auth.onboardOwner(body);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register-client')
  @ApiOperation({ summary: 'Registrar un cliente en un complejo existente (sin sesión, hay que verificar el email)' })
  async registerClient(@Body() body: RegisterClientDto) {
    return this.auth.registerClient(body);
  }

  @Get('organizations')
  @ApiOperation({ summary: 'Listar complejos públicos para el registro de clientes' })
  listOrganizations() {
    return this.auth.listPublicOrganizations();
  }

  @Get('organizations/:organizationId/courts')
  @ApiOperation({ summary: 'Listar canchas públicas de un complejo' })
  listOrganizationCourts(@Param('organizationId') organizationId: string) {
    return this.auth.listPublicCourts(organizationId);
  }

  @Get('organizations/:organizationId/facilities')
  @ApiOperation({ summary: 'Listar complejos públicos de una organización, con sus canchas' })
  listOrganizationFacilities(@Param('organizationId') organizationId: string) {
    return this.auth.listPublicFacilities(organizationId);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión en Sistema Canchas' })
  async login(@Body() body: LoginB2bDto, @Res({ passthrough: true }) res: ExpressResponse) {
    const { refreshToken, ...session } = await this.auth.login(body.email, body.password);
    setRefreshCookie(res, B2B_REFRESH_COOKIE, refreshToken);
    return session;
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('refresh')
  @UseGuards(CsrfRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar la sesión B2B con el refresh token en cookie HttpOnly' })
  async refresh(@Req() req: ExpressRequest, @Res({ passthrough: true }) res: ExpressResponse) {
    const cookieRefresh = readCookie(req, B2B_REFRESH_COOKIE);
    if (!cookieRefresh) {
      throw new UnauthorizedException('No hay sesión activa.');
    }
    const { refreshToken, ...session } = await this.auth.refresh(cookieRefresh);
    setRefreshCookie(res, B2B_REFRESH_COOKIE, refreshToken);
    return session;
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar el email con el token recibido por correo' })
  async verifyEmail(@Body() body: VerifyEmailDto, @Query('token') tokenFromUrl?: string) {
    // El enlace del email trae el token en la query; el cliente lo manda en el body.
    return this.auth.verifyEmail(tokenFromUrl ?? body.token ?? '');
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reenviar el email de verificación (respuesta genérica)' })
  async resendVerification(@Body() body: ResendVerificationDto) {
    return this.auth.resendVerification(body.email);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('logout')
  @UseGuards(CsrfRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión B2B: elimina la cookie de refresh' })
  logout(@Res({ passthrough: true }) res: ExpressResponse) {
    clearRefreshCookie(res, B2B_REFRESH_COOKIE);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(B2bJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil completo del usuario actual, con rol y contacto de WhatsApp' })
  me(@CurrentB2bUser() user: B2bJwtUser) {
    return this.auth.getProfile(user.userId, user.organizationId);
  }

  @Patch('profile')
  @UseGuards(B2bJwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el contacto de WhatsApp del usuario actual (teléfono y consentimiento)' })
  updateProfile(@CurrentB2bUser() user: B2bJwtUser, @Body() body: UpdateProfileDto) {
    return this.auth.updateProfile(user.userId, user.organizationId, body);
  }

  @Patch('organization')
  @UseGuards(B2bJwtGuard, B2bRolesGuard)
  @B2bRoles(B2bRoleCode.OWNER, B2bRoleCode.ADMIN, B2bRoleCode.OPERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar el contacto de WhatsApp de la organización (staff)' })
  updateOrganizationContact(@CurrentB2bUser() user: B2bJwtUser, @Body() body: UpdateOrganizationContactDto) {
    return this.auth.updateOrganizationContact(user.organizationId, body);
  }
}