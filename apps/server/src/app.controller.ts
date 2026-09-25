import { Controller, Get, NotFoundException, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { B2B_DATABASE_HEALTH, DatabaseHealthCheck } from './persistence/persistence.module';

@Controller()
@ApiTags('General')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Inject(B2B_DATABASE_HEALTH) private readonly b2bDatabase: DatabaseHealthCheck,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Ruta raíz del backend' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificar disponibilidad del backend' })
  getHealth() {
    return { status: 'ok' };
  }

  @Get('health/b2b')
  @ApiOperation({ summary: 'Verificar disponibilidad de la base B2B' })
  async getB2bHealth() {
    await this.b2bDatabase.check();
    return { status: 'ok', database: 'b2b' };
  }

  @Get('debug/positions')
  @ApiOperation({ summary: 'Verificar posiciones en la base de datos' })
  async getPositions() {
    // Endpoint de depuración: inhabilitado en producción (hallazgo MEDIO del informe).
    // Swagger (/docs) se apaga en main.ts; esta ruta se defiende acá para que
    // no exista un contrato público que liste las posiciones de la base.
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    const positions = await this.appService.getPlayerPositions();
    return {
      message: 'Posiciones actuales en la base de datos',
      positions: positions
    };
  }
}
