import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { REDIS_CONFIG } from './redis.config';
import { MatchRequestDto } from 'src/matching/dto/match-request.dto';
import Redis from 'ioredis';
import { MatchedPairDto } from 'src/matching/dto/matched-pair.dto';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(RedisService.name);
  private readonly REQUEST_EXPIRATION_MS = 30000;

  constructor() {
    this.redis = new Redis({
      host: REDIS_CONFIG.host,
      port: REDIS_CONFIG.port as number
    })
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

  async addMatchRequest(matchRequest: MatchRequestDto & { socketId: string }): Promise<void> {
    const score = matchRequest.timestamp;
    const value = JSON.stringify(matchRequest);

    await this.redis.zadd(REDIS_CONFIG.keys.matchRequests, score, value);

    await this.redis.set(
      `${REDIS_CONFIG.keys.userMatches}${matchRequest.userId}`,
      value,
      'PX',
      this.REQUEST_EXPIRATION_MS + 500
    );
  }

  async findPotentialMatches(topic: string, userId: string): Promise<any[]> {
    const matches = await this.redis.zrangebyscore(
      REDIS_CONFIG.keys.matchRequests,
      '-inf',
      '+inf'
    );

    return matches
      .map(match => JSON.parse(match))
      .filter(match => match.topic === topic && match.userId !== userId);
  }

  async removeMatchRequest(userId: string): Promise<void> {
    const requestDetails = await this.redis.get(`${REDIS_CONFIG.keys.userMatches}${userId}`);
    if (requestDetails) {
      await this.redis.zrem(REDIS_CONFIG.keys.matchRequests, requestDetails);
      await this.redis.del(`${REDIS_CONFIG.keys.userMatches}${userId}`);
    }
  }

  async createMatch(match: MatchedPairDto): Promise<void> {
    const matchKey = `${REDIS_CONFIG.keys.matchDetails}${match.matchId}`;

    await this.redis.hmset(matchKey, {
      ...match,
      timestamp: Date.now().toString(),
    });

    await this.removeMatchRequest(match.user1.userId);
    await this.removeMatchRequest(match.user2.userId);
  }

  async checkUserHasActiveRequest(userId: string): Promise<boolean> {
    const exists = await this.redis.exists(`${REDIS_CONFIG.keys.userMatches}${userId}`);
    return exists === 1;
  }

  async checkRequestExists(userId: string, timestamp: number): Promise<boolean> {
    const matchRequests = await this.getAllMatchRequests();
    return matchRequests.some(match => match.userId === userId && match.timestamp === timestamp);
  }

  async getAllMatchRequests(): Promise<Array<MatchRequestDto & { socketId: string; timestamp: number }>> {
    try {
      const matches = await this.redis.zrangebyscore(
        REDIS_CONFIG.keys.matchRequests,
        '-inf',
        '+inf'
      );

      return matches.map(match => JSON.parse(match));
    } catch (error) {
      this.logger.error('Failed to get all match requests:', error);
      throw error;
    }
  }

  async removeMatchRequestBySocketId(socketId: string): Promise<void> {
    try {
      const matches = await this.getAllMatchRequests();
      const matchRequest = matches.find(match => match.socketId === socketId);

      if (matchRequest) {
        await this.removeMatchRequest(matchRequest.userId);
      }
    } catch (error) {
      this.logger.error('Failed to remove match request by socket ID:', error);
      throw error;
    }
  }
}
