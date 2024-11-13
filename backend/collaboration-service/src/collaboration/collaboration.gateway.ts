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
  port: process.env.WEBSOCKET_PORT || 8080,
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

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from collab service: ${client.id}`);
    const data = await this.collabService.getUserNameAndMatchId(client.id);

    if (!data) {
      return;
    }

    await this.collabService.handleDisconnect(
      data.matchId,
      client.id,
      data.username,
    );

    const webSocketIds = await this.collabService.getCollabSessionWebSockets(
      data.matchId,
    );

    const joinedUsers = await this.collabService.getJoinedUsers(data.matchId);

    for (const ids of webSocketIds) {
      this.server.to(ids).emit('userList', joinedUsers);
      this.logger.log(`New question sent to ${ids}`);
    }
  }

  @SubscribeMessage('joinCollabSession')
  async handleJoinCollabSession(
    @MessageBody()
    data: {
      matchId: string;
      username: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { matchId, username } = data;
      if (!matchId || !username) {
        throw new WsException('MatchId is missing');
      }
      this.logger.debug(
        `New socket joined: ${client.id} for user ${username} and session ${matchId}`,
      );

      const registerSuccess = await this.collabService.registerWSToSession(
        matchId,
        client.id,
        username,
      );

      if (!registerSuccess) {
        client.emit('invalidMatchId', { message: 'Not allowed.' });
      } else {
        await this.collabService.addUser(matchId, username);
        const sessionMetaData = await this.collabService.getOnloadData(matchId);

        const webSocketIds =
          await this.collabService.getCollabSessionWebSockets(matchId);

        for (const ids of webSocketIds) {
          this.server.to(ids).emit('onloadData', sessionMetaData);
        }
      }
    } catch (error) {
      this.logger.error(`Error from client ${data.username}:`, error);

      client.emit(`collabError`, {
        message:
          error instanceof WsException
            ? error.message
            : `Error connecting to collab`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleNewMessage(
    @MessageBody()
    data: {
      sender: string;
      content: string;
      timestamp: number;
      matchId: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const { sender, content, timestamp, matchId } = data;
    if (!sender || !content || !timestamp || !matchId) {
      throw new WsException('Missing parameters');
    }
    client.data.matchId = data.matchId;

    const messageData = {
      sender: sender,
      content: content,
      timestamp: timestamp,
    };
    await this.collabService.updateMessage(matchId, messageData);
    const webSocketIds =
      await this.collabService.getCollabSessionWebSockets(matchId);

    for (const ids of webSocketIds) {
      this.server.to(ids).emit('message', messageData);
      this.logger.log(`New question sent to ${ids}`);
    }
  }

  @SubscribeMessage(`updateSessionName`)
  async handleUpdateSessionName(
    @MessageBody() data: { newSessionName: string; matchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const { newSessionName, matchId } = data;
      if (!newSessionName) {
        throw new WsException('Missing parameters');
      }

      await this.collabService.updateSessionName(newSessionName, matchId);

      const webSocketIds =
        await this.collabService.getCollabSessionWebSockets(matchId);

      for (const ids of webSocketIds) {
        this.server.to(ids).emit('newSessionName', newSessionName);
      }
    } catch (error) {
      this.logger.error('Error updating session name:', error);
      client.emit('collabError', {
        message: 'Failed to generate update session name',
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
        const dataToSend = await this.collabService.getSessionQuestion(
          data.matchId,
        );

        this.logger.debug(webSocketIds);
        for (const ids of webSocketIds) {
          this.server.to(ids).emit('question', dataToSend);
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
