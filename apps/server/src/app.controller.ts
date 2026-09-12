import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppService } from './app.service';

@Controller()
@ApiTags('General')
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectDataSource('b2b') private readonly b2bDataSource: DataSource,
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
    await this.b2bDataSource.query('SELECT 1');
    return { status: 'ok', database: 'b2b' };
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
