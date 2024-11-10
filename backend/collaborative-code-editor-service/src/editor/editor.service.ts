import { Injectable } from '@nestjs/common';
import { Session } from './schemas/session.schema';
import { QuestionAttempt } from './schemas/question-attempt.schema';
import { ExecutionResults, QuestionSubmission } from './schemas/question-submission.schema';
import { SessionModel } from './session.model';
import { SessionCache } from './session.cache';

@Injectable()
export class EditorService {
  constructor(
    private readonly sessionModel: SessionModel,
    private readonly sessionCache: SessionCache,
  ) {}

  async getSessionIfActive(sessionId: string): Promise<Session | null> {
    const cachedSession = await this.sessionCache.getSession(sessionId);
    if (cachedSession) {
      return cachedSession;
    }

    const session = await this.sessionModel.findOne(sessionId, false);
    if (session) {
      await this.sessionCache.setSession(sessionId, session);
    }
    return session;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const cachedSession = await this.sessionCache.getSession(sessionId);
    if (cachedSession) {
      return cachedSession;
    }

    const session = await this.sessionModel.findOne(sessionId);
    if (session) {
      await this.sessionCache.setSession(sessionId, session);
    }
    return session;
  }

  async getAllSessions(): Promise<Session[]> {
    return this.sessionModel.findAll();
  }

  async getLastSubmissionExecutionResult(
    sessionId: string,
    questionId: string
  ): Promise<QuestionSubmission | null> {
    const session = await this.getSession(sessionId);
    if (!session) {
      return null;
    }
    const questionAttempt = session.questionAttempts.find(
      (attempt) => attempt.questionId === questionId
    );
    if (!questionAttempt) {
      return null;
    }
    return questionAttempt.submissions[questionAttempt.submissions.length - 1] || null;
  }

  async updateLastSubmission(
    sessionId: string,
    questionId: string,
    status: 'pending' | 'accepted' | 'rejected',
    executionResults: ExecutionResults,
  ): Promise<QuestionSubmission> {
    const submission = await this.sessionModel.updateLastSubmission(
      sessionId,
      questionId,
      status,
      executionResults
    );
    await this.sessionCache.invalidateSession(sessionId);
    return submission;
  }

  async createSessionIfNotCompleted(sessionId: string): Promise<Session | null> {
    const existingSession = await this.sessionModel.findOne(sessionId, true);
    if (existingSession) {
      return null;
    }
    
    const session = await this.sessionModel.create(sessionId);
    await this.sessionCache.setSession(sessionId, session);
    return session;
  }

  async createQuestionAttempt(
    sessionId: string,
    questionId: string,
  ): Promise<QuestionAttempt> {
    await this.sessionCache.invalidateSession(sessionId);

    const questionAttempt: QuestionAttempt = {
      questionId,
      submissions: [],
      startedAt: new Date(),
      currentCode: '',
      currentLanguage: 'javascript',
    };

    await this.sessionModel.addQuestionAttempt(sessionId, questionAttempt);
    await this.removMultipleQuestionAttemptsIfAvailable(sessionId, questionId);

    setTimeout(async () => {
      await this.removMultipleQuestionAttemptsIfAvailable(sessionId, questionId);
    }, 3000);

    return questionAttempt;
  }

  private async removMultipleQuestionAttemptsIfAvailable(
    sessionId: string,
    questionId: string
  ): Promise<void> {
    const session = await this.sessionModel.findOne(sessionId);
    if (!session) return;

    const questionAttemptIndices = session.questionAttempts
      .map((qa, i) => (qa.questionId === questionId ? i : null))
      .filter(Number);

    if (questionAttemptIndices.length <= 1) return;

    const questionAttempts = session.questionAttempts.filter(
      (_, i) => !questionAttemptIndices.slice(0, -1).includes(i)
    );

    await this.sessionModel.updateQuestionAttempts(sessionId, questionAttempts);
    await this.sessionCache.invalidateSession(sessionId);
  }

  async updateQuestionCode(
    sessionId: string,
    questionId: string,
    code: string,
    language: string
  ): Promise<void> {
    const updatedSession = await this.sessionModel.updateQuestionCode(
      sessionId,
      questionId,
      code,
      language
    );

    if (!updatedSession) {
      await this.createQuestionAttempt(sessionId, questionId);
      await this.updateQuestionCode(sessionId, questionId, code, language);
      return;
    }

    await this.sessionCache.setQuestionCode(sessionId, questionId, code, language);
    await this.sessionCache.invalidateSession(sessionId);
  }

  async submitQuestionAttempt(
    sessionId: string,
    questionId: string,
    submission: Partial<QuestionSubmission>
  ): Promise<void> {
    const newSubmission: QuestionSubmission = {
      code: submission.code,
      language: submission.language,
      submittedAt: new Date(),
    } as QuestionSubmission;

    await this.sessionModel.submitQuestion(sessionId, questionId, newSubmission);
    await this.sessionCache.invalidateSession(sessionId);
  }

  async addUserToSession(sessionId: string, userId: string): Promise<void> {
    await this.sessionCache.addUser(sessionId, userId);
    await this.sessionModel.addUser(sessionId, userId);
  }

  async removeUserFromSession(sessionId: string, userId: string): Promise<void> {
    await this.sessionCache.removeUser(sessionId, userId);
    await this.sessionModel.removeUser(sessionId, userId);
  }

  async getActiveUsers(sessionId: string): Promise<string[]> {
    const cachedUsers = await this.sessionCache.getActiveUsers(sessionId);
    if (cachedUsers.length > 0) {
      return cachedUsers;
    }

    const session = await this.sessionModel.findOne(sessionId);
    if (session?.activeUsers?.length > 0) {
      await this.sessionCache.setActiveUsers(sessionId, session.activeUsers);
      return session.activeUsers;
    }

    return [];
  }

  async completeSession(sessionId: string): Promise<void> {
    let noActiveUsers = true;
    for (let i = 0; i < 5; i++) {
      const activeUsers = await this.getActiveUsers(sessionId);
      if (activeUsers.length !== 0) {
        noActiveUsers = false;
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (noActiveUsers) {
      await this.sessionModel.completeSession(sessionId);
    }

    await this.sessionCache.invalidateSession(sessionId);
  }

  async setActiveUsers(sessionId: string, userIds: string[]): Promise<void> {
    await this.sessionCache.setActiveUsers(sessionId, userIds);
    await this.sessionModel.setActiveUsers(sessionId, userIds);
  }
}