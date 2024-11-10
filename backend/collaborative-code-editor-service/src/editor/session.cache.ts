import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Session } from './schemas/session.schema';

@Injectable()
export class SessionCache {
  private readonly redis: Redis;
  private readonly SESSION_TTL = 3600; // 1 hour in seconds

  constructor(private configService: ConfigService) {
    this.redis = new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
    });
  }

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private getUsersKey(sessionId: string): string {
    return `session:${sessionId}:users`;
  }

  private getQuestionCodeKey(sessionId: string, questionId: string): string {
    return `session:${sessionId}:question:${questionId}:code`;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const cachedSession = await this.redis.get(this.getSessionKey(sessionId));
    return cachedSession ? JSON.parse(cachedSession) : null;
  }

  async setSession(sessionId: string, session: Session): Promise<void> {
    await this.redis.setex(
      this.getSessionKey(sessionId),
      this.SESSION_TTL,
      JSON.stringify(session)
    );
  }

  async invalidateSession(sessionId: string): Promise<void> {
    await this.redis.del(this.getSessionKey(sessionId));
  }

  async getActiveUsers(sessionId: string): Promise<string[]> {
    return await this.redis.smembers(this.getUsersKey(sessionId));
  }

  async addUser(sessionId: string, userId: string): Promise<void> {
    await this.redis.sadd(this.getUsersKey(sessionId), userId);
  }

  async removeUser(sessionId: string, userId: string): Promise<void> {
    await this.redis.srem(this.getUsersKey(sessionId), userId);
  }

  async setActiveUsers(sessionId: string, userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      await this.redis.del(this.getUsersKey(sessionId));
      return;
    }
    await this.redis.sadd(this.getUsersKey(sessionId), ...userIds);
  }

  async setQuestionCode(
    sessionId: string,
    questionId: string,
    code: string,
    language: string
  ): Promise<void> {
    await this.redis.setex(
      this.getQuestionCodeKey(sessionId, questionId),
      this.SESSION_TTL,
      JSON.stringify({ code, language })
    );
  }
}