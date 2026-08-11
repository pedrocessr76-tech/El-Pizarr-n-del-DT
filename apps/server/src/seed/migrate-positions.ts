import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../player/player.entity';

@Injectable()
export class MigratePositionsService implements OnModuleInit {
  private readonly logger = new Logger(MigratePositionsService.name);

  constructor(
    @InjectRepository(PlayerEntity)
    private readonly playerRepo: Repository<PlayerEntity>,
  ) {}

  async onModuleInit() {
    await this.migratePositions();
  }

  private async migratePositions() {
    this.logger.log('Iniciando migración de posiciones...');

    const migrations: Array<{ from: string[]; to: string }> = [
      // Porteros
      { from: ['GK', 'POR'], to: 'POR' },
      
      // Laterales
      { from: ['RB', 'RWB', 'LD'], to: 'LD' },
      { from: ['LB', 'LWB', 'LI'], to: 'LI' },
      
      // Defensas centrales
      { from: ['CB', 'DEF', 'DFC'], to: 'DFC' },
      
      // Mediocentros
      { from: ['CDM', 'MCD'], to: 'MCD' },
      { from: ['CM', 'MC'], to: 'MC' },
      { from: ['CAM', 'MCO'], to: 'MCO' },
      
      // Mediocampistas laterales
      { from: ['RM', 'MD'], to: 'MD' },
      { from: ['LM', 'MI'], to: 'MI' },
      
      // Extremos
      { from: ['RW', 'ED'], to: 'ED' },
      { from: ['LW', 'EI'], to: 'EI' },
      
      // Delanteros
      { from: ['FWD', 'DC'], to: 'DC' },
      { from: ['ST'], to: 'DC' },
      { from: ['CF', 'SS', 'SD'], to: 'SD' },
    ];

    let totalUpdated = 0;

    for (const migration of migrations) {
      const result = await this.playerRepo
        .createQueryBuilder()
        .update(PlayerEntity)
        .set({ position: migration.to })
        .where('position IN (:...positions)', { positions: migration.from })
        .andWhere('position != :finalPosition', { finalPosition: migration.to })
        .execute();

      const updated = result.affected || 0;
      if (updated > 0) {
        this.logger.log(`  ${migration.from.join(', ')} → ${migration.to}: ${updated} jugadores actualizados`);
        totalUpdated += updated;
      }
    }

    // Mostrar resumen final
    const summary = await this.playerRepo
      .createQueryBuilder()
      .select('position')
      .addSelect('COUNT(*)', 'count')
      .groupBy('position')
      .orderBy('position')
      .getRawMany();

    this.logger.log('\nResumen de posiciones después de la migración:');
    summary.forEach(row => {
      this.logger.log(`  ${row.position}: ${row.count}`);
    });

    this.logger.log(`\nMigración completada: ${totalUpdated} jugadores actualizados en total`);
  }
}