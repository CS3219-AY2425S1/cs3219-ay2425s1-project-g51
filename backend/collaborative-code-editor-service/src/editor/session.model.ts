import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Session, SessionDocument } from './schemas/session.schema';
import { QuestionAttempt } from './schemas/question-attempt.schema';
import { QuestionSubmission, ExecutionResults } from './schemas/question-submission.schema';

@Injectable()
export class SessionModel {
  constructor(
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>,
  ) {}

  async findOne(sessionId: string, isCompleted?: boolean): Promise<SessionDocument | null> {
    const query = { sessionId };
    if (typeof isCompleted === 'boolean') {
      query['isCompleted'] = isCompleted;
    }
    return this.sessionModel.findOne(query).exec();
  }

  async findAll(): Promise<Session[]> {
    return this.sessionModel.find().exec();
  }

  async create(sessionId: string): Promise<Session> {
    const session = new this.sessionModel({
      sessionId,
      activeUsers: [],
      allUsers: [],
      questionAttempts: [],
    });
    return session.save();
  }

  async updateLastSubmission(
    sessionId: string,
    questionId: string,
    status: 'pending' | 'accepted' | 'rejected',
    executionResults: ExecutionResults,
  ): Promise<QuestionSubmission> {
    const session = await this.findOne(sessionId);
    if (!session) {
      throw new Error(`Session not found for ID: ${sessionId}`);
    }

    const questionAttempt = session.questionAttempts.find(
      (attempt) => attempt.questionId === questionId,
    );
    if (!questionAttempt) {
      throw new Error(`Question attempt not found for ID: ${questionId}`);
    }

    const lastSubmission =
      questionAttempt.submissions[questionAttempt.submissions.length - 1];
    if (!lastSubmission) {
      throw new Error(`No submission found for question: ${questionId}`);
    }

    lastSubmission.status = status;
    lastSubmission.executionResults = executionResults;

    await session.save();
    return lastSubmission;
  }

  async addQuestionAttempt(
    sessionId: string,
    questionAttempt: QuestionAttempt,
  ): Promise<void> {
    await this.sessionModel.updateOne(
      { sessionId },
      {
        $push: { questionAttempts: questionAttempt },
      }
    ).exec();
  }

  async updateQuestionCode(
    sessionId: string,
    questionId: string,
    code: string,
    language: string
  ): Promise<Session | null> {
    return this.sessionModel.findOneAndUpdate(
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
  }

  async submitQuestion(
    sessionId: string,
    questionId: string,
    submission: QuestionSubmission
  ): Promise<void> {
    await this.sessionModel.updateOne(
      {
        sessionId,
        'questionAttempts.questionId': questionId
      },
      {
        $push: { 'questionAttempts.$.submissions': submission },
      }
    );
  }

  async addUser(sessionId: string, userId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { sessionId },
      {
        $addToSet: { activeUsers: userId, allUsers: userId.split(':')[0] },
        $setOnInsert: { questionAttempts: [] }
      },
      { upsert: true }
    ).exec();
  }

  async removeUser(sessionId: string, userId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { sessionId },
      { $pull: { activeUsers: userId } }
    ).exec();
  }

  async setActiveUsers(sessionId: string, userIds: string[]): Promise<void> {
    await this.sessionModel.updateOne(
      { sessionId },
      { $set: { activeUsers: userIds } }
    ).exec();
  }

  async completeSession(sessionId: string): Promise<void> {
    await this.sessionModel.updateOne(
      { sessionId },
      { $set: { isCompleted: true } }
    );
  }

  async updateQuestionAttempts(
    sessionId: string,
    questionAttempts: QuestionAttempt[]
  ): Promise<void> {
    await this.sessionModel.updateOne(
      { sessionId },
      { $set: { questionAttempts } }
    ).exec();
  }
}