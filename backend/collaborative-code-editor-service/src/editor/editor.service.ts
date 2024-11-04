import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { QuestionAttempt } from './schemas/question-attempt.schema';
import { QuestionSubmission } from './schemas/question-submission.schema';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { stringify } from 'querystring';

@Injectable()
export class EditorService {
  private readonly redis: Redis;

  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
    private configService: ConfigService,
  ) {
    this.redis = new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
    });
  }

  async getSessionIfActive(sessionId: string): Promise<Session | null> {
    const cachedSession = await this.redis.get(`session:${sessionId}`);
    if (cachedSession) {
      return JSON.parse(cachedSession);
    }

    const session = await this.sessionModel.findOne({ sessionId, isCompleted: false }).exec();
    if (session) {
      await this.redis.setex(
        `session:${sessionId}`,
        3600,
        JSON.stringify(session)
      );
      return session;
    }
    return null;
  }

  // TODO: Remove later
  async createSessionIfNotCompleted(sessionId: string): Promise<Session> {
    const existingSession = await this.sessionModel.findOne({ sessionId, isCompleted: true }).exec();
    if (existingSession) {
      return null;
    }
    const session = new this.sessionModel({
      sessionId,
      activeUsers: [],
      questionAttempts: [],
    });
    await session.save();

    // Add session to cache
    await this.redis.setex(`session:${sessionId}`, 3600, JSON.stringify(session));
    return session;
  }

  async createQuestionAttempt(
    sessionId: string,
    questionId: string,
  ): Promise<QuestionAttempt> {
    // TODO: Add default current language in some config file
    const questionAttempt: QuestionAttempt = {
      questionId,
      submissions: [],
      startedAt: new Date(),
      currentCode: '',
      currentLanguage: 'javascript',
    };

    await this.sessionModel.updateOne(
      { sessionId },
      {
        $push: { questionAttempts: questionAttempt },
      }
    );

    // Invalidate cache
    await this.redis.del(`session:${sessionId}`);

    return questionAttempt;
  }

  async updateQuestionCode(
    sessionId: string,
    questionId: string,
    code: string,
    language: string
  ): Promise<void> {
    const updatedSession = await this.sessionModel.findOneAndUpdate(
      {
        sessionId,
        'questionAttempts.questionId': questionId
      },
      {
        $set: {
          'questionAttempts.$.currentCode': code,
          'questionAttempts.$.currentLanguage': language,
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedSession) {
      await this.createQuestionAttempt(sessionId, questionId);
      await this.updateQuestionCode(sessionId, questionId, code, language);
    }

    // Update in Redis
    await this.redis.setex(
      `session:${sessionId}:question:${questionId}:code`,
      3600,
      JSON.stringify({ code, language })
    );

    // Invalidate cache
    await this.redis.del(`session:${sessionId}`);
  }

  async submitQuestionAttempt(
    sessionId: string,
    questionId: string,
    submission: Partial<QuestionSubmission>
  ): Promise<void> {
    // TODO: Check if session id and question id already has pending submission
    const newSubmission: QuestionSubmission = {
      code: submission.code,
      language: submission.language,
      submittedAt: new Date(),
    } as QuestionSubmission;

    await this.sessionModel.updateOne(
      {
        sessionId,
        'questionAttempts.questionId': questionId
      },
      {
        $push: { 'questionAttempts.$.submissions': newSubmission },
      }
    );

    // TODO: Add code for executing test cases here, change status of submission

    // Invalidate cache
    await this.redis.del(`session:${sessionId}`);
  }

  async addUserToSession(sessionId: string, userId: string): Promise<void> {
    await this.redis.sadd(`session:${sessionId}:users`, userId);

    await this.sessionModel.updateOne(
      { sessionId },
      {
        $addToSet: { activeUsers: userId },
        $setOnInsert: { questionAttempts: [] }
      },
      { upsert: true }
    );

  }

  async removeUserFromSession(sessionId: string, userId: string): Promise<void> {
    await this.redis.srem(`session:${sessionId}:users`, userId);

    await this.sessionModel.updateOne(
      { sessionId },
      { $pull: { activeUsers: userId } }
    );

  }

  async getActiveUsers(sessionId: string): Promise<string[]> {
    const cachedUsers = await this.redis.smembers(`session:${sessionId}:users`);
    if (cachedUsers.length > 0) {
      return cachedUsers;
    }

    const session = await this.sessionModel.findOne({ sessionId }).exec();
    if (session && session.activeUsers && session.activeUsers.length > 0) {
      await this.redis.sadd(`session:${sessionId}:users`, ...session.activeUsers);
      return session.activeUsers;
    }

    return [];
  }

  async completeSession(sessionId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { sessionId },
      { $set: { isCompleted: true } }
    );

    await this.redis.del(`session:${sessionId}`);
  }

  async setActiveUsers(sessionId: string, userIds: string[]): Promise<void> {
    if (userIds.length === 0) {
      await this.redis.del(`session:${sessionId}:users`);
      return;
    }
    await this.redis.sadd(`session:${sessionId}:users`, ...userIds);

    await this.sessionModel.updateOne(
      { sessionId },
      { $set: { activeUsers: userIds } }
    );
  }
}