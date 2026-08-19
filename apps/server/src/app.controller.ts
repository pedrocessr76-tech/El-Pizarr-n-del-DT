import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
@ApiTags('General')
export class AppController {
  constructor(private readonly appService: AppService) {}

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

  @Get('debug/positions')
  @ApiOperation({ summary: 'Verificar posiciones en la base de datos' })
  async getPositions() {
    const positions = await this.appService.getPlayerPositions();
    return {
      message: 'Posiciones actuales en la base de datos',
      positions: positions
    };
  }
}
