import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/clinic',
})
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedUsers = new Map<string, { userId: string; socketId: string; role: string }>();

  handleConnection(client: Socket) {
    const userId = client.handshake.auth.userId as string || client.handshake.headers['x-user-id'] as string;
    if (userId) {
      this.connectedUsers.set(client.id, { userId, socketId: client.id, role: '' });
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } else {
      this.logger.warn(`Anonymous connection attempted: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      this.logger.log(`Client disconnected: ${client.id} (user: ${user.userId})`);
      this.connectedUsers.delete(client.id);
    }
  }

  emitAppointmentUpdate(event: string, data: unknown) {
    this.server.emit('appointment:update', { event, data, timestamp: new Date().toISOString() });
  }

  emitQueueUpdate(queue: unknown) {
    this.server.emit('queue:update', { queue, timestamp: new Date().toISOString() });
  }

  emitNotification(userId: string, notification: unknown) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  emitPatientUpdate(patientId: string, data: unknown) {
    this.server.to(`patient:${patientId}`).emit('patient:update', data);
  }

  joinRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
  }

  leaveRoom(client: Socket, room: string) {
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
  }
}