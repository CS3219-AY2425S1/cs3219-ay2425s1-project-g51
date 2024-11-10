import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CONFIG } from './redis.config';
import { WebSocketKeyDto } from 'src/collaboration/dto/websocket-key.dto';

@Injectable()
export class CollabRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(CollabRedisService.name);
  private readonly EXPIRATION_MS = 864000;

  constructor() {
    this.redis = new Redis({
      host: REDIS_CONFIG.host,
      port: REDIS_CONFIG.port as number,
    });
  }

  async onModuleInit() {
    try {
      await this.redis.ping();
      this.logger.log('Redis connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }

  async getCollabSessionData(matchId: string): Promise<any> {
    const key = `${REDIS_CONFIG.keys.sessionData}:${matchId}`;
    const data = await this.redis.get(key);
    this.logger.log(`data from collab redis of matchId ${matchId}: ${data}`);

    return data ? JSON.parse(data) : null;
  }

  async addCollabRecordToRedis(
    matchId: string,
    topic: string,
    difficulty: string,
    userIds: string[],
  ): Promise<void> {
    const key = `${REDIS_CONFIG.keys.sessionData}:${matchId}`;
    const value = {
      question: null,
      webSockets: [],
      topic: topic,
      difficulty: difficulty,
      questionIds: [],
      messages: [],
      sessionName: 'Coding Session',
      joinedUsers: [],
      allowedUsers: userIds,
    };

    await this.redis.set(key, JSON.stringify(value), 'EX', this.EXPIRATION_MS);
    const data = await this.redis.get(key);
    this.logger.log(`added record ${data}`);
  }

  async getCollabQuestion(matchId: string): Promise<any> {
    const value = await this.getCollabSessionData(matchId);
    if (value) {
      return {
        question: value.question || null,
        topic: value.topic || null,
        difficulty: value.difficulty || null,
      };
    }

    return { question: null, topic: null, difficulty: null };
  }

  async getQuestionIds(matchId: string): Promise<string[]> {
    const value = await this.getCollabSessionData(matchId);
    const questionIds = value.questionIds;

    return questionIds ? questionIds : [];
  }

  async updateQuestion(
    matchId: string,
    newQuestion: any,
    topic: string,
    difficulty: string,
  ): Promise<void> {
    const key = `${REDIS_CONFIG.keys.sessionData}:${matchId}`;
    const value = await this.getCollabSessionData(matchId);
    if (value) {
      value.question = newQuestion;
      value.topic = topic;
      value.difficulty = difficulty;
      value.questionIds.push(newQuestion._id);
      await this.redis.set(
        key,
        JSON.stringify(value),
        'EX',
        this.EXPIRATION_MS,
      );
    }
  }

  async addWebSocketId(matchId: string, websocketId: string, username:string): Promise<boolean> {
    const key = `${REDIS_CONFIG.keys.sessionData}:${matchId}`;
    const value = await this.getCollabSessionData(matchId);

    if (value) {
      if (value.allowedUsers.includes(username)) {
        value.webSockets.push(websocketId);
        await this.redis.set(
          key,
          JSON.stringify(value),
          'EX',
          this.EXPIRATION_MS,
        );
        return true;
      }
      this.logger.warn(`${username} is not allowed to join ${matchId}`);
    }

    return false;
  }

  async getCollabSessionWebSocketIds(matchId: string): Promise<string[]> {
    const value = await this.getCollabSessionData(matchId);
    const websocketIds = value.webSockets;

    return websocketIds;
  }

  async endSession(matchId: string): Promise<void> {
    const key = `${REDIS_CONFIG.keys.sessionData}:${matchId}`;
    await this.redis.del(key);
  }

  async updateMessage(matchId: string, messageData: any) {
    const key = `${REDIS_CONFIG.keys.sessionData}:${matchId}`;
    const value = await this.getCollabSessionData(matchId);
    if (value) {
      this.logger.debug(messageData);
      value.messages.push(messageData);
      this.logger.debug(`New message pushed ${value}`);
      await this.redis.set(
        key,
        JSON.stringify(value),
        'EX',
        this.EXPIRATION_MS,
      );
    }
  }

  async removeWebSocketIdAndUsername(
    matchId: string,
    webSocketId: string,
    username: string,
  ): Promise<void> {
    const key = `${REDIS_CONFIG.keys.sessionData}:${matchId}`;
    const value = await this.getCollabSessionData(matchId);
    if (value) {
      value.webSockets = value.webSockets.filter(
        (id: any) => id !== webSocketId,
      );
      const index = value.joinedUsers.findIndex(
        (name: any) => name === username,
      );
      value.joinedUsers = [
        ...value.joinedUsers.slice(0, index),
        ...value.joinedUsers.slice(index + 1),
      ];
      this.logger.debug(value.webSockets);
      await this.redis.set(
        key,
        JSON.stringify(value),
        'EX',
        this.EXPIRATION_MS,
      );
    }
    const webSocketKey = `${REDIS_CONFIG.keys.sessionWebSocket}:${webSocketId}`;
    await this.redis.del(webSocketKey);
  }

  async getOnloadData(matchId: string): Promise<any> {
    const data = await this.getCollabSessionData(matchId);
    const initData = {
      question: data.question,
      topic: data.topic,
      difficulty: data.difficulty,
      messages: data.messages,
      sessionName: data.sessionName,
      joinedUsers: data.joinedUsers,
    };

    return initData;
  }

  async addUser(matchId: string, username: string): Promise<void> {
    const key = `${REDIS_CONFIG.keys.sessionData}:${matchId}`;
    const value = await this.getCollabSessionData(matchId);
    if (true) {
      value.joinedUsers.push(username);
      await this.redis.set(
        key,
        JSON.stringify(value),
        'EX',
        this.EXPIRATION_MS,
      );
    }

  }

  async updateSessionName(
    newSessionName: string,
    matchId: string,
  ): Promise<void> {
    const key = `${REDIS_CONFIG.keys.sessionData}:${matchId}`;
    const value = await this.getCollabSessionData(matchId);
    if (value) {
      value.sessionName = newSessionName;
      await this.redis.set(
        key,
        JSON.stringify(value),
        'EX',
        this.EXPIRATION_MS,
      );
    }
  }

  async addWebSocketKey(
    id: string,
    webSocketDTO: WebSocketKeyDto,
  ): Promise<void> {
    const key = `${REDIS_CONFIG.keys.sessionWebSocket}:${id}`;
    await this.redis.set(
      key,
      JSON.stringify(webSocketDTO),
      'EX',
      this.EXPIRATION_MS,
    );
    const data = await this.redis.get(key);
    this.logger.log(`added record ${data}`);
  }

  async getUserNameAndMatchId(webSocketId: string): Promise<WebSocketKeyDto> {
    const key = `${REDIS_CONFIG.keys.sessionWebSocket}:${webSocketId}`;
    const data = await this.redis.get(key);

    return data ? JSON.parse(data) : null;
  }

  async getJoinedUsers(matchId: string): Promise<any> {
    const data = await this.getCollabSessionData(matchId);
    return data.joinedUsers;
  }
}
