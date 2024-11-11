import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { CollabRedisService } from 'src/redis/redis.service';
import { WebSocketKeyDto } from './dto/websocket-key.dto';

@Injectable()
export class CollabService {
  private readonly logger = new Logger(CollabService.name);

  constructor(
    private readonly collabRedisService: CollabRedisService,
    private readonly httpService: HttpService,
  ) {}

  async getCollabSessionWebSockets(matchId: string): Promise<string[]> {
    const data =
      await this.collabRedisService.getCollabSessionWebSocketIds(matchId);

    return data;
  }

  async getSessionQuestion(matchId: string): Promise<any> {
    const data = await this.collabRedisService.getCollabQuestion(matchId);

    return data;
  }

  async registerWSToSession(
    matchId: string,
    id: string,
    username: string,
  ): Promise<boolean> {
    const addWsIDtoTRedis = await this.collabRedisService.addWebSocketId(
      matchId,
      id,
      username,
    );

    if (!addWsIDtoTRedis) {
      return false;
    }

    const webSocketKey = {
      matchId: matchId,
      username: username,
    };
    await this.collabRedisService.addWebSocketKey(id, webSocketKey);
    this.logger.log(`WebSocket ID ${id} registered for session ${matchId}`);

    return true;
  }

  async updateSessionQuestion(
    matchId: string,
    topic: string,
    difficulty: string,
  ): Promise<any> {
    const idsToExclude = await this.collabRedisService.getQuestionIds(matchId);
    const requestBody = {
      category: topic,
      complexity: difficulty,
      idsToExclude: idsToExclude,
    };
    try {
      this.logger.debug(
        `Request body for calling question collab: ${JSON.stringify(requestBody, null, 2)}`,
      );

      const question_url = process.env.QUESTION_SERVICE_URL;

      const response = await this.httpService
        .post(`${question_url}/questions/collab`, requestBody)
        .toPromise();

      const newQuestion = response.data;
      if (newQuestion) {
        await this.collabRedisService.updateQuestion(
          matchId,
          newQuestion,
          topic,
          difficulty,
        );
      }

      return newQuestion;
    } catch (error) {
      this.logger.error(
        `Failed to call question endpoint for collab`,
        error.message,
      );
      return null;
    }
  }

  async createSessionRecord(
    matchId: string,
    difficulty: string,
    topic: string,
    userIds: string[],
  ): Promise<any> {
    await this.collabRedisService.addCollabRecordToRedis(
      matchId,
      topic,
      difficulty,
      userIds,
    );

    const initQuestion = await this.updateSessionQuestion(
      matchId,
      topic,
      difficulty,
    );
    this.logger.log(`Trying to create redis record for session: ${matchId}`);

    return initQuestion;
  }

  async updateMessage(matchId: string, messageData: any): Promise<void> {
    await this.collabRedisService.updateMessage(matchId, messageData);
  }

  async handleDisconnect(
    matchId: string,
    webSocketId: string,
    username: string,
  ): Promise<void> {
    await this.collabRedisService.removeWebSocketIdAndUsername(
      matchId,
      webSocketId,
      username,
    );
  }

  async getOnloadData(matchId: string): Promise<any> {
    const data = await this.collabRedisService.getOnloadData(matchId);
    this.logger.debug(data);

    return data;
  }

  async addUser(matchId: string, username: string): Promise<void> {
    await this.collabRedisService.addUser(matchId, username);
  }

  async updateSessionName(
    newSessionName: string,
    matchId: string,
  ): Promise<void> {
    await this.collabRedisService.updateSessionName(newSessionName, matchId);
  }

  async getUserNameAndMatchId(webSocketId: string): Promise<WebSocketKeyDto> {
    const data =
      await this.collabRedisService.getUserNameAndMatchId(webSocketId);

    return data;
  }

  async getJoinedUsers(matchId: string): Promise<any> {
    const data = await this.collabRedisService.getJoinedUsers(matchId);

    return data;
  }
}
