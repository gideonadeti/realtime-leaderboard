import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class LeaderboardGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LeaderboardGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client with id ${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client with id ${client.id} disconnected`);
  }

  emitToClients(event: string, payload: any) {
    this.server.emit(event, payload);
  }
}
