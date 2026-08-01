import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class RegisterDto {
  @ApiProperty({ example: 'coach_javier', description: 'Nombre de usuario (3-15 caracteres)' })
  username!: string;

  @ApiProperty({ example: 'miPassword123', description: 'Contraseña' })
  password!: string;
}

class LoginDto {
  @ApiProperty({ example: 'coach_javier', description: 'Nombre de usuario' })
  username!: string;

  @ApiProperty({ example: 'miPassword123', description: 'Contraseña' })
  password!: string;
}

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiBody({ type: RegisterDto })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.username, body.password);
  }

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
