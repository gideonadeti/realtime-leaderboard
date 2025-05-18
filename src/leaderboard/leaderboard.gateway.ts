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

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    server.use((socket: Socket & { user: any }, next) => {
      wsClerkAuthMiddleware(this.authService)(socket, next).catch(next);
    });

    Logger.log('WebSocket server initialized', LeaderboardGateway.name);
  }

  handleConnection(client: Socket & { user: AuthPayload }) {
    const userId = client.user.sub;

    this.userSocketMap.set(userId, client.id);

    Logger.log(
      `Client with id ${client.id} connected`,
      LeaderboardGateway.name,
    );
  }
}
