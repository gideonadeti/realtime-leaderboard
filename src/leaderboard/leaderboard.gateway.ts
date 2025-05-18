import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { AuthPayload } from 'src/auth/auth-payload.interface';
import { AuthService } from 'src/auth/auth.service';
import { wsClerkAuthMiddleware } from 'src/auth/middlewares/ws-clerk-auth.middleware';

@WebSocketGateway()
export class LeaderboardGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(private readonly authService: AuthService) {}

  private userSocketMap = new Map<string, string>();

  private logger = new Logger(LeaderboardGateway.name);

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    server.use((socket: Socket & { user: any }, next) => {
      wsClerkAuthMiddleware(this.authService)(socket, next).catch(next);
    });

    this.logger.log('WebSocket server initialized');
  }

  handleConnection(client: Socket & { user: AuthPayload }) {
    const userId = client.user.sub;

    this.userSocketMap.set(userId, client.id);

    this.logger.log(`Client with id ${client.id} connected`);
  }

  handleDisconnect(client: Socket & { user: AuthPayload }) {
    const userId = client.user.sub;

    this.userSocketMap.delete(userId);

    this.logger.log(`Client with id ${client.id} disconnected`);
  }

  emitToClients(event: string, data: any) {
    this.server.emit(event, data);
  }
}
