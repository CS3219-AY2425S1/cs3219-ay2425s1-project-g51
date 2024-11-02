import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { CollabService } from './collaboration.service';
import * as dotenv from 'dotenv';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

dotenv.config();

@WebSocketGateway({
  cors: {
    origin: process.env.WEBSOCKET_ORIGIN,
  },
  namespace: '/',
  port: parseInt(process.env.WEBSOCKET_PORT, 10),
})
export class CollabGateway implements OnGatewayDisconnect {
  private readonly logger = new Logger(CollabGateway.name);
  @WebSocketServer() server: Server;

  constructor(private readonly collabService: CollabService) {}

  afterInit(server: Server) {
    this.logger.log('Collab Websocket Gateway initalized');
    global.io = server;
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to collab service: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from collab service: ${client.id}`);
  }

  @SubscribeMessage('joinCollabSession')
  async handleJoinCollabSession(
    @MessageBody()
    data: {
      matchId: string;
      userId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data.matchId) {
        throw new WsException('MatchId is missing');
      }

      await this.collabService.registerWSToSession(data.matchId, client.id);
      const questionData = await this.collabService.getSessionQuestion(
        data.matchId,
      );

      if (questionData) {
        client.emit('question', questionData);
      } else {
        client.emit('newQuestionError', {
          message:
            'No questions with the specified parameters. Please try again with different parameters.',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error(`Error from client ${data.userId}:`, error);

      client.emit(`collabError`, {
        message:
          error instanceof WsException
            ? error.message
            : `Error connecting to collab`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage(`generateNewQuestion`)
  async handleNewQuestionRequest(
    @MessageBody() data: { matchId: string; topic: string; difficulty: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { matchId, topic, difficulty } = data;
      if (!matchId || !topic || !difficulty) {
        throw new WsException('Missing parameters');
      }

      const newQuestion = await this.collabService.updateSessionQuestion(
        matchId,
        topic,
        difficulty,
      );

      if (newQuestion) {
        const webSocketIds =
          await this.collabService.getCollabSessionWebSockets(matchId);
        this.logger.debug(webSocketIds);
        for (const ids of webSocketIds) {
          this.server.to(ids).emit('question', newQuestion);
          this.logger.log(`New question sent to ${ids}`);
        }
        this.logger.log(`New question sent for session: ${matchId}`);
      } else {
        client.emit('newQuestionError', {
          message:
            'No new question with the specified parameters. Please try again with different parameters.',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      this.logger.error('Error with generating new question:', error);
      client.emit('collabError', {
        message: 'Failed to generate new question',
        timestamp: new Date().toISOString(),
      });
    }
  }
}