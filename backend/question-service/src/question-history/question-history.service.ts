
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateQuestionSubmissionDto } from './dto/create-question-submission.dto';
import { UpdateQuestionSubmissionDto } from './dto/update-question-submission.dto';
import { QuestionSubmission } from './schemas/question-history.schema';
import { QuestionHistoryDB } from './question-history.model'; 

@Injectable()
export class QuestionHistoryService {
  
  constructor(
      private readonly questionHistoryDB: QuestionHistoryDB,
    ) {}

    async create(CreateQuestionSubmissionDto: CreateQuestionSubmissionDto): Promise<QuestionSubmission> {
      return this.questionHistoryDB.createQuestionHistory(CreateQuestionSubmissionDto);
    }
    async update(id: string, UpdateQuestionSubmissionDto: UpdateQuestionSubmissionDto): Promise<QuestionSubmission> {
      return this.questionHistoryDB.updateQuestionHistory(id, UpdateQuestionSubmissionDto);
    }
    async findAll(): Promise<QuestionSubmission[]> {
      return this.questionHistoryDB.getAllQuestionHistory();
    }
    async findAllInSession(sessionId: string): Promise<QuestionSubmission[]> {
      return this.questionHistoryDB.getQuestionHistoryBySession(sessionId);
    }
    async findOne(sessionId: string, questionId: string): Promise<QuestionSubmission> {
      return this.questionHistoryDB.getSingleQuestionHistory(sessionId, questionId);
    }
  }

