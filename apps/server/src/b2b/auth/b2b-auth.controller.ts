import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { B2bJwtGuard } from './b2b-jwt.guard';
import { CurrentB2bUser } from './b2b-auth.decorators';
import { B2bAuthService } from './b2b-auth.service';
import { B2bJwtUser } from './b2b-auth.types';

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

@Controller('api/v1/auth')
@ApiTags('B2B Auth')
export class B2bAuthController {
  constructor(private readonly auth: B2bAuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('onboarding')
  @ApiOperation({ summary: 'Onboarding de propietario: crea el complejo, su cuenta OWNER y una sede inicial opcional' })
  onboarding(@Body() body: OnboardingDto) {
    return this.auth.onboardOwner(body);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register-client')
  @ApiOperation({ summary: 'Registrar un cliente en un complejo existente' })
  registerClient(@Body() body: RegisterClientDto) {
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
  login(@Body() body: LoginB2bDto) {
    return this.auth.login(body.email, body.password);
  }

  @Get('me')
  @UseGuards(B2bJwtGuard)
  @ApiBearerAuth()
  me(@CurrentB2bUser() user: B2bJwtUser) {
    return user;
  }
}