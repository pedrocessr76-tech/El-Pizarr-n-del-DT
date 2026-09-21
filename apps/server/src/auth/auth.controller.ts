import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

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
  guest() {
    return this.authService.getGuestToken();
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: RegisterDto })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.username, body.password);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  @ApiBody({ type: LoginDto })
  login(@Body() body: LoginDto) {
    return this.authService.login(body.username, body.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }
}
