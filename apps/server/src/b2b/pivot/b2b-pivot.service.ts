import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { B2bNotificationsService } from '../notifications/b2b-notifications.service';
import { B2bUserEntity } from '../entities/user.entity';
import { B2bBookingEntity } from '../entities/booking.entity';
import { B2bCourtEntity } from '../entities/court.entity';
import { B2bShiftEntity } from '../entities/shift.entity';
import { B2bOrganizationEntity } from '../entities/organization.entity';
import { BookingStatus } from '../entities/b2b.enums';
import { B2bJwtUser } from '../auth/b2b-auth.types';
import { B2bPivotRequestEntity } from './b2b-pivot-request.entity';
import { B2bPivotMessageEntity } from './b2b-pivot-message.entity';
import { canChangeBookingStatus, canSendWhatsApp, deriveCourtCapacity, isStaffRole, isValidCourtSize, isValidShiftDuration } from '../domain-policy';
import { B2bNotificationsGateway } from '../notifications/b2b-notifications.gateway';
import { MessagingService } from '../messaging/messaging.service';
import { escapeHtml } from '../messaging/html';
import { orgDateString, orgTimeString, resolveTimeZone } from '../time';
import { getRepositoryPortToken, inValues, RepositoryPort } from '../../persistence/repository.port';

const ALLOWED_ROLES = ['GOALKEEPER', 'FIELD', 'BOTH'];
const ALLOWED_POSITIONS = new Set(['POR', 'LD', 'DFC', 'LI', 'MCD', 'MC', 'MD', 'MI', 'MCO', 'ED', 'EI', 'SD', 'DC']);

@Injectable()
export class B2bPivotService {
  private readonly logger = new Logger(B2bPivotService.name);

  constructor(
    @Inject(getRepositoryPortToken(B2bUserEntity, 'b2b')) private readonly users: RepositoryPort<B2bUserEntity>,
    @Inject(getRepositoryPortToken(B2bPivotRequestEntity, 'b2b')) private readonly requests: RepositoryPort<B2bPivotRequestEntity>,
    @Inject(getRepositoryPortToken(B2bPivotMessageEntity, 'b2b')) private readonly messages: RepositoryPort<B2bPivotMessageEntity>,
    @Inject(getRepositoryPortToken(B2bBookingEntity, 'b2b')) private readonly bookings: RepositoryPort<B2bBookingEntity>,
    @Inject(getRepositoryPortToken(B2bShiftEntity, 'b2b')) private readonly shifts: RepositoryPort<B2bShiftEntity>,
    @Inject(getRepositoryPortToken(B2bCourtEntity, 'b2b')) private readonly courts: RepositoryPort<B2bCourtEntity>,
    @Inject(getRepositoryPortToken(B2bOrganizationEntity, 'b2b')) private readonly organizations: RepositoryPort<B2bOrganizationEntity>,
    private readonly notifications: B2bNotificationsService,
    private readonly gateway: B2bNotificationsGateway,
    private readonly messaging: MessagingService,
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
        role: profile.pivotRole,
        positions: profile.pivotPositions ?? [],
        organizationId: profile.organizationId,
      }));
  }

  async contact(fromUser: B2bJwtUser, targetUserId: string, bookingId: string, message?: string) {
    if (fromUser.userId === targetUserId) {
      throw new BadRequestException('No podés contactarte a vos mismo.');
    }

    const [sender, target, booking] = await Promise.all([
      this.users.findOne({ where: { id: fromUser.userId } }),
      this.users.findOne({ where: { id: targetUserId, pivotAvailable: true } }),
      this.bookings.findOne({
        where: {
          id: bookingId,
          organizationId: fromUser.organizationId,
          clientUserId: fromUser.userId,
          status: inValues([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        },
      }),
    ]);

    if (!sender) throw new NotFoundException('Tu cuenta no fue encontrada.');
    if (!target) throw new NotFoundException('Ese jugador pivote ya no está disponible.');
    if (!booking) throw new NotFoundException('Necesitás una reserva activa propia para solicitar un pivote.');
    const [shift, court] = await Promise.all([
      this.shifts.findOne({ where: { id: booking.shiftId, courtId: booking.courtId, organizationId: booking.organizationId } }),
      this.courts.findOne({ where: { id: booking.courtId, organizationId: booking.organizationId } }),
    ]);
    if (!shift || !court || shift.startsAt.getTime() <= Date.now()) {
      throw new BadRequestException('La reserva debe corresponder a un turno futuro.');
    }
    const organization = await this.organizations.findOneByOrFail({ id: booking.organizationId });
    const timeZone = resolveTimeZone(organization.timezone);
    const matchDate = orgDateString(shift.startsAt, timeZone);
    const matchTime = orgTimeString(shift.startsAt, timeZone);
    const existing = await this.requests.findOne({ where: { requesterUserId: sender.id, pivotUserId: target.id, bookingId } });
    if (existing) throw new ConflictException('Ya solicitaste a este jugador para esa reserva.');

    const request = await this.requests.save(this.requests.create({
      requesterUserId: sender.id,
      requesterOrganizationId: sender.organizationId,
      pivotUserId: target.id,
      pivotOrganizationId: target.organizationId,
      bookingId,
      status: 'PENDING',
      respondedAt: null,
    }));
    const note = message?.trim();
    if (note) {
      const initial = await this.messages.save(this.messages.create({ requestId: request.id, senderUserId: sender.id, body: note }));
      request.lastMessageAt = initial.createdAt;
      await this.requests.save(request);
    }

    await this.notifications.notifyUser(
      target.id,
      target.organizationId,
      {
        type: 'pivot_contact_request',
        severity: 'info',
        title: 'Nueva solicitud para jugar',
        body: `${sender.fullName} te solicita para ${court.name} el ${matchDate} a las ${matchTime}.${note ? ` ${note}` : ''}`,
        metadata: { conversationId: request.id },
      },
      sender.id,
    );

    await this.notifications.notifyUser(
      sender.id,
      sender.organizationId,
      {
        type: 'pivot_contact_request',
        severity: 'success',
        title: 'Solicitud enviada',
        body: 'Tu solicitud quedó en el chat privado del jugador pivote.',
        metadata: { conversationId: request.id },
      },
      target.id,
    );

    try {
      await this.messaging.sendEmail(
        target.email,
        {
          text: `${sender.fullName} te solicita para jugar en ${court.name} el ${matchDate} a las ${matchTime}. Ingresá a Sistema Canchas para responder desde Solicitudes pivote o abrir el chat privado.`,
          html: `<p>${escapeHtml(sender.fullName)} te solicita para jugar en ${escapeHtml(court.name)} el ${matchDate} a las ${matchTime}.</p><p>Ingresá a Sistema Canchas para responder desde Solicitudes pivote o abrir el chat privado.</p>`,
        },
        'Nueva solicitud de jugador pivote',
        'generic',
        { conversationId: request.id },
      );
    } catch (error) {
      this.logger.warn(`No se pudo enviar el email de una solicitud pivote (${request.id}).`);
    }

    if (target.whatsappPhone && target.whatsappOptIn) {
      try {
        await this.messaging.sendWhatsApp(
          target.whatsappPhone,
          `${sender.fullName} te solicita para jugar en ${court.name} el ${matchDate} a las ${matchTime}. Respondé desde la app.`,
          'pivot_request',
          { conversationId: request.id },
        );
      } catch (error) {
        this.logger.warn(`No se pudo enviar el WhatsApp de una solicitud pivote (${request.id}).`);
      }
    }

    return {
      sent: true,
      conversationId: request.id,
    };
  }

  async getMyRequests(user: B2bJwtUser) {
    const requests = await this.requests.find({
      where: [{ requesterUserId: user.userId }, { pivotUserId: user.userId }],
      order: { lastMessageAt: 'DESC' },
      take: 100,
    });
    if (requests.length === 0) return [];
    const bookingIds = [...new Set(requests.map((item) => item.bookingId).filter((id): id is string => Boolean(id)))];
    if (bookingIds.length === 0) return [];
    const [bookings, users] = await Promise.all([
      this.bookings.find({ where: { id: inValues(bookingIds) } }),
      this.users.find({ where: { id: inValues([...new Set(requests.flatMap((item) => [item.requesterUserId, item.pivotUserId]))]) } }),
    ]);
    const [shifts, courts] = await Promise.all([
      this.shifts.find({ where: { id: inValues([...new Set(bookings.map((item) => item.shiftId))]) } }),
      this.courts.find({ where: { id: inValues([...new Set(bookings.map((item) => item.courtId))]) } }),
    ]);
    const bookingById = new Map(bookings.map((item) => [item.id, item]));
    const shiftById = new Map(shifts.map((item) => [item.id, item]));
    const courtById = new Map(courts.map((item) => [item.id, item]));
    const userById = new Map(users.map((item) => [item.id, item]));

    return requests.flatMap((request) => {
      if (!request.bookingId) return [];
      const booking = bookingById.get(request.bookingId);
      if (!booking) return [];
      const shift = shiftById.get(booking.shiftId);
      const court = courtById.get(booking.courtId);
      if (!shift || !court) return [];
      const isRequester = request.requesterUserId === user.userId;
          return [{
            id: request.id,
            conversationId: request.id,
            bookingId: request.bookingId,
            status: request.status,
            respondedAt: request.respondedAt,
            isRequester,
            canRespond: !isRequester && request.status === 'PENDING' &&
              [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status as BookingStatus) &&
              shift.startsAt.getTime() > Date.now(),
            requesterName: userById.get(request.requesterUserId)?.fullName ?? 'Jugador',
            pivotName: userById.get(request.pivotUserId)?.fullName ?? 'Jugador pivote',
            courtName: court.name,
            courtSportType: court.sportType,
            shiftStartsAt: shift.startsAt,
            shiftEndsAt: shift.endsAt,
            bookingStatus: booking.status,
            createdAt: request.createdAt,
          }];
    });
  }

  async respondToRequest(user: B2bJwtUser, requestId: string, decision: 'ACCEPTED' | 'DECLINED') {
    const request = await this.findParticipantRequest(user.userId, requestId);
    if (request.pivotUserId !== user.userId) throw new NotFoundException('Solicitud no encontrada.');
    if (request.status !== 'PENDING') throw new ConflictException('Esta solicitud ya tiene una respuesta.');
    if (decision === 'ACCEPTED') {
      if (!request.bookingId) throw new ConflictException('Esta solicitud antigua no está asociada a una reserva.');
      const booking = await this.bookings.findOne({
        where: {
          id: request.bookingId,
          status: inValues([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
        },
      });
      const shift = booking ? await this.shifts.findOne({ where: { id: booking.shiftId } }) : null;
      if (!shift || shift.startsAt.getTime() <= Date.now()) {
        throw new ConflictException('La reserva ya no está disponible para confirmar el partido.');
      }
    }
    request.status = decision;
    request.respondedAt = new Date();
    await this.requests.save(request);
    const update = { id: request.id, status: request.status, respondedAt: request.respondedAt };
    this.gateway.emitPivotRequestUpdated(request.requesterUserId, update);
    this.gateway.emitPivotRequestUpdated(request.pivotUserId, update);
    await this.notifications.notifyUser(
      request.requesterUserId,
      request.requesterOrganizationId,
      {
        type: 'pivot_contact_request',
        severity: decision === 'ACCEPTED' ? 'success' : 'warning',
        title: decision === 'ACCEPTED' ? 'El pivote confirmó' : 'El pivote no puede asistir',
        body: decision === 'ACCEPTED' ? 'El jugador confirmó que va al partido.' : 'El jugador indicó que no puede asistir.',
        metadata: { conversationId: request.id },
      },
      user.userId,
    );
    return update;
  }

  async getChat(user: B2bJwtUser, requestId: string) {
    const request = await this.findParticipantRequest(user.userId, requestId);
    const messages = await this.messages.find({ where: { requestId }, order: { createdAt: 'DESC' }, take: 200 });
    return { id: request.id, isPivot: request.pivotUserId === user.userId, messages: messages.reverse().map((message) => this.toMessage(request.id, message)) };
  }

  async sendChatMessage(user: B2bJwtUser, requestId: string, body: string) {
    const text = body?.trim();
    if (!text || text.length > 1000) throw new BadRequestException('El mensaje debe tener entre 1 y 1000 caracteres.');
    const request = await this.findParticipantRequest(user.userId, requestId);
    const sender = await this.users.findOne({ where: { id: user.userId } });
    if (!sender) throw new NotFoundException('Usuario no encontrado.');
    const message = await this.messages.save(this.messages.create({ requestId, senderUserId: sender.id, body: text }));
    request.lastMessageAt = message.createdAt;
    await this.requests.save(request);

    const recipientUserId = sender.id === request.requesterUserId ? request.pivotUserId : request.requesterUserId;
    const recipientOrganizationId = sender.id === request.requesterUserId
      ? request.pivotOrganizationId
      : request.requesterOrganizationId;
    const payload = this.toMessage(request.id, message);
    this.gateway.emitPivotChatMessage(request.requesterUserId, payload);
    this.gateway.emitPivotChatMessage(request.pivotUserId, payload);
    await this.notifications.notifyUser(
      recipientUserId,
      recipientOrganizationId,
      {
        type: 'pivot_chat_message',
        severity: 'info',
        title: 'Nuevo mensaje de jugador pivote',
        body: 'Tenés un nuevo mensaje en una solicitud para jugar.',
        metadata: { conversationId: request.id },
      },
      sender.id,
    );

    const recipient = await this.users.findOne({ where: { id: recipientUserId } });
    if (recipient?.whatsappPhone && recipient?.whatsappOptIn) {
      try {
        await this.messaging.sendWhatsApp(
          recipient.whatsappPhone,
          `${sender.fullName}: ${text}`,
          'pivot_message',
          { conversationId: request.id },
        );
      } catch (error) {
        this.logger.warn(`No se pudo enviar el WhatsApp de un mensaje pivote (${request.id}).`);
      }
    }

    return payload;
  }

  private async findParticipantRequest(userId: string, requestId: string): Promise<B2bPivotRequestEntity> {
    const request = await this.requests.findOne({
      where: [
        { id: requestId, requesterUserId: userId },
        { id: requestId, pivotUserId: userId },
      ],
    });
    if (!request) throw new NotFoundException('Conversación no encontrada.');
    return request;
  }

  private toMessage(requestId: string, message: B2bPivotMessageEntity) {
    return {
      id: message.id,
      conversationId: requestId,
      senderUserId: message.senderUserId,
      body: message.body,
      createdAt: message.createdAt,
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
