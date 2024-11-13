import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, OnGatewayDisconnect, OnGatewayConnection, WsException } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchService } from './match.service';
import { MatchRequestDto } from './dto/match-request.dto';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

@WebSocketGateway({
  cors: {
    origin: process.env.WEBSOCKET_ORIGIN,
  },
  namespace: '/',
  port: process.env.WEBSOCKET_PORT || 8080,
})
export class MatchGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(MatchGateway.name);
  constructor(private readonly matchService: MatchService) {}

  afterInit(server: Server) {
    this.logger.log('Match WebSocket Gateway initialized');
    global.io = server;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('requestMatch')
  async handleMatchRequest(
    @MessageBody() matchRequest: MatchRequestDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.log(`Match request received from user ${matchRequest.userId}`);
      this.validateMatchRequest(matchRequest);
      client.emit('requestAcknowledged', {
        message: 'Match request received and being processed',
        timestamp: new Date().toISOString(),
      });
      await this.matchService.handleMatchRequest(matchRequest, client);
    } catch (error) {
      this.logger.error(`Error handling match request from user ${matchRequest.userId}:`, error);      
      client.emit('matchError', {
        message: error instanceof WsException ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('cancelMatch')
  async handleCancelMatch(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.logger.log(`Cancel match request received from user ${data.userId}`);
      
      if (!data.userId) {
        throw new WsException('UserId is required to cancel match');
      }

      await this.matchService.cancelMatch(data.userId, client.id);
    } catch (error) {
      this.logger.error(`Error cancelling match for user ${data.userId}:`, error);
      
      client.emit('matchError', {
        message: error instanceof WsException ? error.message : 'Error cancelling match request',
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.matchService.handleDisconnect(client.id);
  }

  private validateMatchRequest(matchRequest: MatchRequestDto): void {
    if (!matchRequest.userId) {
      throw new WsException('UserId is required');
    }
    if (!matchRequest.topic) {
      throw new WsException('Topic is required');
    }
    if (!matchRequest.difficulty || !['easy', 'medium', 'hard'].includes(matchRequest.difficulty.toLowerCase())) {
      throw new WsException('Valid difficulty (easy, medium, hard) is required');
    }
  }
}
