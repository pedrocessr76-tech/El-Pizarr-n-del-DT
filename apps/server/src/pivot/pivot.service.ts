import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { UserEntity } from '../user/user.entity';
import { getRepositoryPortToken, RepositoryPort } from '../persistence/repository.port';

const ALLOWED_ROLES = ['GOALKEEPER', 'FIELD', 'BOTH'];
const ALLOWED_POSITIONS = new Set(['POR', 'LD', 'DFC', 'LI', 'MCD', 'MC', 'MD', 'MI', 'MCO', 'ED', 'EI', 'SD', 'DC']);

@Injectable()
export class PivotService {
  constructor(
    @Inject(getRepositoryPortToken(UserEntity)) private readonly users: RepositoryPort<UserEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  async getMyProfile(userId: string) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Cuenta no encontrada.');
    return this.toProfile(user);
  }

  async updateMyProfile(userId: string, input: { available?: boolean; role?: string; positions?: string[] }) {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Cuenta no encontrada.');
    const role = input.role ?? user.pivotRole ?? 'FIELD';
    const positions = input.positions ?? user.pivotPositions ?? [];
    if (!ALLOWED_ROLES.includes(role)) throw new BadRequestException('Tipo de pivote inválido.');
    if (!Array.isArray(positions) || positions.some((position) => !ALLOWED_POSITIONS.has(position))) {
      throw new BadRequestException('Hay posiciones favoritas inválidas.');
    }
    if (role === 'GOALKEEPER' && positions.some((position) => position !== 'POR')) {
      throw new BadRequestException('Un perfil de arquero solo puede elegir POR.');
    }
    if (role === 'FIELD' && positions.includes('POR')) {
      throw new BadRequestException('El arquero debe seleccionarse como tipo de pivote.');
    }
    user.pivotRole = role;
    user.pivotPositions = Array.from(new Set(positions));
    if (input.available !== undefined) user.pivotAvailable = input.available;
    if (user.pivotAvailable && role !== 'GOALKEEPER' && user.pivotPositions.length === 0) {
      throw new BadRequestException('Elegí al menos una posición favorita antes de ofrecerte como pivote.');
    }
    await this.users.save(user);
    return this.toProfile(user);
  }

  async listAvailable(userId: string, position?: string) {
    if (position && !ALLOWED_POSITIONS.has(position)) throw new BadRequestException('Posición inválida.');
    const profiles = await this.users.find({ where: { pivotAvailable: true }, order: { username: 'ASC' } });
    return profiles
      .filter((profile) => profile.id !== userId && (!position || profile.pivotPositions?.includes(position) || (position === 'POR' && (profile.pivotRole === 'GOALKEEPER' || profile.pivotRole === 'BOTH'))))
      .map((profile) => ({ userId: profile.id, username: profile.username, role: profile.pivotRole, positions: profile.pivotPositions ?? [] }));
  }

  async contact(fromUserId: string, targetUserId: string, message?: string) {
    if (fromUserId === targetUserId) throw new BadRequestException('No podés contactarte a vos mismo.');
    const [sender, target] = await Promise.all([
      this.users.findOne({ where: { id: fromUserId } }),
      this.users.findOne({ where: { id: targetUserId, pivotAvailable: true } }),
    ]);
    if (!sender) throw new NotFoundException('Cuenta no encontrada.');
    if (!target) throw new NotFoundException('Ese jugador pivote ya no está disponible.');
    const note = message?.trim();
    this.notifications.notifyUser(target.id, {
      type: 'pivot_contact_request',
      severity: 'info',
      title: 'Te buscan para un partido',
      body: `${sender.username} quiere contactarte como jugador pivote${note ? `: ${note}` : '.'}`,
      metadata: { fromUserId: sender.id, fromUsername: sender.username },
    });
    return { sent: true };
  }

  private toProfile(user: UserEntity) {
    return { available: user.pivotAvailable ?? false, role: user.pivotRole ?? 'FIELD', positions: user.pivotPositions ?? [] };
  }
}
