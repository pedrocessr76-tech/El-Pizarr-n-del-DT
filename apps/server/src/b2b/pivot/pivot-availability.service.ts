import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { RepositoryPort, getRepositoryPortToken } from '../../persistence/repository.port';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { B2bNotificationsService } from '../notifications/b2b-notifications.service';

const POLL_INTERVAL_MS = 60 * 60 * 1000;
const INACTIVITY_DAYS = 90;

@Injectable()
export class PivotAvailabilityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PivotAvailabilityService.name);
  private timer?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    @Inject(getRepositoryPortToken(B2bUserEntity, 'b2b')) private readonly users: RepositoryPort<B2bUserEntity>,
    @Inject(getRepositoryPortToken(B2bOrganizationEntity, 'b2b')) private readonly organizations: RepositoryPort<B2bOrganizationEntity>,
    private readonly notifications: B2bNotificationsService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.deactivateInactivePivots(), POLL_INTERVAL_MS);
    this.timer.unref?.();
    void this.deactivateInactivePivots();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async deactivateInactivePivots(now = new Date()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const organizations = await this.organizations.find();
      if (organizations.length === 0) return;

      for (const org of organizations) {
        const activePivots = await this.users.find({
          where: { organizationId: org.id, pivotAvailable: true },
        });

        for (const pivot of activePivots) {
          const lastLogin = pivot.lastLoginAt ? new Date(pivot.lastLoginAt) : (pivot.updatedAt ? new Date(pivot.updatedAt) : new Date(pivot.createdAt));
          const daysInactive = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);

          if (daysInactive > INACTIVITY_DAYS) {
            pivot.pivotAvailable = false;
            await this.users.save(pivot);

            await this.notifications.notifyUser(
              pivot.id,
              org.id,
              {
                type: 'pivot_contact_request',
                severity: 'info',
                title: 'Disponibilidad de pivote desactivada',
                body: `Tu perfil de pivote se desactivó por inactividad (${INACTIVITY_DAYS} días sin ingreso). Podés reactivarlo desde "Jugador pivote".`,
                metadata: { autoDeactivated: true },
              },
              pivot.id,
            );

            this.logger.log(`Pivote ${pivot.id} (${pivot.email}) desactivado por inactividad de ${daysInactive.toFixed(1)} días`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`No se pudieron desactivar pivotes inactivos: ${(error as Error)?.message ?? error}`);
    } finally {
      this.running = false;
    }
  }
}