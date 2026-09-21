import { createServer, Server as HttpServer } from 'http';
import type { AddressInfo } from 'net';
import { Server } from 'socket.io';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { sign } from 'jsonwebtoken';
import { JwtService } from '@nestjs/jwt';
import { NotificationsGateway } from '../../notifications/notifications.gateway';
import { B2bNotificationsGateway } from './b2b-notifications.gateway';
import { B2bJwtUser } from '../auth/b2b-auth.types';
import { B2bRoleCode } from '../entities/b2b.enums';
import type { NotificationPayload } from '../../../../../packages/shared/types/models';

// Test de INTEGRACIÓN del aislamiento por namespace.
//
// Ambos gateways viven en el mismo servidor socket.io pero en namespaces
// distintos (el del juego en `/`, el B2B en `/b2b`). Sin esa separación, cada
// conexión disparaba el handleConnection de las DOS gateways y la del juego
// cortaba todo socket B2B ("token inválido"), por lo que las notificaciones en
// tiempo real del sistema canchas nunca llegaban. Acá se montan las gateways
// reales y se verifica que cada conexión la ve y valida SOLO su gateway.
describe('Aislamiento de gateways por namespace (B2B vs juego)', () => {
  const payload: NotificationPayload = {
    type: 'b2b_booking_pending',
    severity: 'info',
    title: 'Nueva reserva — Cancha 1',
    body: 'hoy 13:00 • cliente Carla',
    timestamp: Date.now(),
    metadata: { bookingId: 'b-1' },
  };

  const staff: B2bJwtUser = {
    userId: 'admin-1',
    organizationId: 'org-1',
    email: 'admin@test.invalid',
    roles: [B2bRoleCode.ADMIN],
  };

  let httpServer: HttpServer;
  let ioServer: Server;
  let gameGateway: NotificationsGateway;
  let b2bGateway: B2bNotificationsGateway;
  let baseUrl: string;
  const clients: ClientSocket[] = [];

  const once = <T>(emitter: { on: (...args: any[]) => unknown }, event: string, timeoutMs = 3000): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout esperando ${event}`)), timeoutMs);
      emitter.on(event, (arg: T) => {
        clearTimeout(timer);
        resolve(arg);
      });
    });

  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  beforeEach(async () => {
    httpServer = createServer();
    ioServer = new Server(httpServer, {
      path: '/socket.io',
      cors: { origin: true, credentials: true },
    });
    const b2bNs = ioServer.of('/b2b');

    gameGateway = new NotificationsGateway(new JwtService({ secret: process.env.JWT_SECRET! }));
    gameGateway.server = ioServer as never;
    b2bGateway = new B2bNotificationsGateway(
      new JwtService({ secret: process.env.B2B_JWT_SECRET! }) as never,
      { resolveUserFromToken: async () => staff } as never,
    );
    b2bGateway.server = b2bNs as never;

    // Registro por namespace, igual que NestJS con SocketsContainer:
    // el handleConnection de cada gateway solo ve sus propias conexiones.
    ioServer.on('connection', (socket) => void gameGateway.handleConnection(socket));
    b2bNs.on('connection', (socket) => void b2bGateway.handleConnection(socket));

    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    clients.forEach((client) => client.disconnect());
    clients.length = 0;
    if (ioServer) await new Promise<void>((resolve) => ioServer.close(() => resolve()));
    if (httpServer) await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  it('un staff B2B conecta a /b2b, NO lo corta el gateway del juego y recibe los eventos de su org', async () => {
    const token = sign({ ...staff }, process.env.B2B_JWT_SECRET!);
    const client = ioc(`${baseUrl}/b2b`, {
      path: '/socket.io',
      transports: ['polling'],
      auth: { token },
      reconnection: false,
    });
    clients.push(client);

    await once<void>(client, 'connect');
    expect(client.connected).toBe(true);

    // Deja que el handleConnection del servidor termine de unirse al canal.
    await sleep(100);
    b2bGateway.emitToOrganization(staff.organizationId, payload);
    b2bGateway.emitToUser(staff.userId, payload);
    await once<NotificationPayload>(client, 'notification');

    // El gateway del juego ya no interviene: la conexión sigue viva un rato más.
    await sleep(150);
    expect(client.connected).toBe(true);
  });

  it('un cliente del juego (namespace /) sigue conectando y recibe notificaciones, aislado del gateway B2B', async () => {
    const token = sign({ sub: 'user-game-1', username: 'jugador' }, process.env.JWT_SECRET!);
    const client = ioc(baseUrl, {
      path: '/socket.io',
      transports: ['polling'],
      auth: { token },
      reconnection: false,
    });
    clients.push(client);

    await once<void>(client, 'connect');
    expect(client.connected).toBe(true);

    await sleep(100);
    gameGateway.emitToUser('user-game-1', payload);
    await once<NotificationPayload>(client, 'notification');

    await sleep(150);
    expect(client.connected).toBe(true);
  });

  it('un token del juego en /b2b es rechazado (aislamiento de autenticación por namespace)', async () => {
    const token = sign({ sub: 'user-game-1', username: 'jugador' }, process.env.JWT_SECRET!);
    const client = ioc(`${baseUrl}/b2b`, {
      path: '/socket.io',
      transports: ['polling'],
      auth: { token },
      reconnection: false,
    });
    clients.push(client);

    await once<void>(client, 'disconnect');
    expect(client.connected).toBe(false);
  });
});