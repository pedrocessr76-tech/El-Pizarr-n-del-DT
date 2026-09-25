import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import { PlayerEntity } from '../player/player.entity';
import { RepositoryPort, getRepositoryPortToken } from '../persistence/repository.port';

@Injectable()
export class MigratePositionsService implements OnModuleInit {
  private readonly logger = new Logger(MigratePositionsService.name);

  constructor(
    @Inject(getRepositoryPortToken(PlayerEntity)) private readonly playerRepo: RepositoryPort<PlayerEntity>,
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

    const players = await this.playerRepo.find();
    for (const migration of migrations) {
      const matching = players.filter((player) => migration.from.includes(player.position) && player.position !== migration.to);
      for (const player of matching) {
        player.position = migration.to;
        await this.playerRepo.save(player);
      }
      const updated = matching.length;
      if (updated > 0) {
        this.logger.log(`  ${migration.from.join(', ')} → ${migration.to}: ${updated} jugadores actualizados`);
        totalUpdated += updated;
      }
    }

    // Mostrar resumen final
    const summary = [...players.reduce((counts, player) => {
      counts.set(player.position, (counts.get(player.position) ?? 0) + 1);
      return counts;
    }, new Map<string, number>())].sort(([a], [b]) => a.localeCompare(b));

    this.logger.log('\nResumen de posiciones después de la migración:');
    summary.forEach(([position, count]) => {
      this.logger.log(`  ${position}: ${count}`);
    });

    this.logger.log(`\nMigración completada: ${totalUpdated} jugadores actualizados en total`);
  }
}
