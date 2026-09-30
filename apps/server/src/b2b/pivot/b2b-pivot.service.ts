import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { B2bNotificationsService } from '../notifications/b2b-notifications.service';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bJwtUser } from '../auth/b2b-auth.types';
import { getRepositoryPortToken, RepositoryPort } from '../../persistence/repository.port';

const ALLOWED_ROLES = ['GOALKEEPER', 'FIELD', 'BOTH'];
const ALLOWED_POSITIONS = new Set(['POR', 'LD', 'DFC', 'LI', 'MCD', 'MC', 'MD', 'MI', 'MCO', 'ED', 'EI', 'SD', 'DC']);

@Injectable()
export class B2bPivotService {
  constructor(
    @Inject(getRepositoryPortToken(B2bUserEntity, 'b2b')) private readonly users: RepositoryPort<B2bUserEntity>,
    private readonly notifications: B2bNotificationsService,
  ) {}

  async getMyProfile(user: B2bJwtUser) {
    const account = await this.users.findOne({ where: { id: user.userId } });
    if (!account) throw new NotFoundException('Usuario no encontrado.');
    return this.toProfile(account);
  }

  async updateMyProfile(user: B2bJwtUser, input: { available?: boolean; role?: string; positions?: string[] }) {
    const account = await this.users.findOne({ where: { id: user.userId } });
    if (!account) throw new NotFoundException('Usuario no encontrado.');

    const role = input.role ?? account.pivotRole ?? 'FIELD';
    const positions = input.positions ?? account.pivotPositions ?? [];

    if (!ALLOWED_ROLES.includes(role)) throw new BadRequestException('Tipo de pivote inválido.');
    if (!Array.isArray(positions) || positions.some((pos) => !ALLOWED_POSITIONS.has(pos))) {
      throw new BadRequestException('Hay posiciones favoritas inválidas.');
    }
    if (role === 'GOALKEEPER' && positions.some((pos) => pos !== 'POR')) {
      throw new BadRequestException('Un perfil de arquero solo puede elegir POR.');
    }
    if (role === 'FIELD' && positions.includes('POR')) {
      throw new BadRequestException('El arquero debe seleccionarse como tipo de pivote.');
    }

    account.pivotRole = role;
    account.pivotPositions = Array.from(new Set(positions));
    if (input.available !== undefined) account.pivotAvailable = input.available;

    if (account.pivotAvailable && role !== 'GOALKEEPER' && account.pivotPositions.length === 0) {
      throw new BadRequestException('Elegí al menos una posición favorita antes de ofrecerte como pivote.');
    }

    await this.users.save(account);
    return this.toProfile(account);
  }

  async listAvailable(user: B2bJwtUser, position?: string, organizationId?: string) {
    if (position && !ALLOWED_POSITIONS.has(position)) {
      throw new BadRequestException('Posición inválida.');
    }

    const where: any = { pivotAvailable: true };
    if (organizationId) {
      where.organizationId = organizationId;
    }

    const profiles = await this.users.find({ where, order: { fullName: 'ASC' } });

    return profiles
      .filter((profile) =>
        profile.id !== user.userId &&
        (!position ||
          profile.pivotPositions?.includes(position) ||
          (position === 'POR' && (profile.pivotRole === 'GOALKEEPER' || profile.pivotRole === 'BOTH'))),
      )
      .map((profile) => ({
        userId: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        role: profile.pivotRole,
        positions: profile.pivotPositions ?? [],
        whatsappPhone: profile.whatsappOptIn ? profile.whatsappPhone : null,
        whatsappOptIn: profile.whatsappOptIn ?? false,
        organizationId: profile.organizationId,
      }));
  }

  async contact(fromUser: B2bJwtUser, targetUserId: string, message?: string) {
    if (fromUser.userId === targetUserId) {
      throw new BadRequestException('No podés contactarte a vos mismo.');
    }

    const [sender, target] = await Promise.all([
      this.users.findOne({ where: { id: fromUser.userId } }),
      this.users.findOne({ where: { id: targetUserId, pivotAvailable: true } }),
    ]);

    if (!sender) throw new NotFoundException('Tu cuenta no fue encontrada.');
    if (!target) throw new NotFoundException('Ese jugador pivote ya no está disponible.');

    const note = message?.trim();
    await this.notifications.notifyUser(
      target.id,
      target.organizationId,
      {
        type: 'pivot_contact_request',
        severity: 'info',
        title: 'Te buscan como jugador pivote',
        body: `${sender.fullName} quiere contactarte para jugar un partido${note ? `: ${note}` : '.'}`,
        metadata: {
          fromUserId: sender.id,
          fromName: sender.fullName,
          fromEmail: sender.email,
        },
      },
      sender.id,
    );

    return {
      sent: true,
      whatsappPhone: target.whatsappOptIn ? target.whatsappPhone : null,
    };
  }

  private toProfile(user: B2bUserEntity) {
    return {
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      available: user.pivotAvailable ?? false,
      role: (user.pivotRole as 'GOALKEEPER' | 'FIELD' | 'BOTH') || 'FIELD',
      positions: user.pivotPositions ?? [],
      whatsappPhone: user.whatsappPhone,
      whatsappOptIn: user.whatsappOptIn ?? false,
    };
  }
}
