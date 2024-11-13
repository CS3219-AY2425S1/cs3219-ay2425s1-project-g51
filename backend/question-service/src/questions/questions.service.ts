import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionDB } from './questions.model';
import { Question } from './schemas/question.schema';
import { FilterQuestionDto } from './dto/filter-question.dto';
import { CollabQuestionDto } from './dto/collab-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly questionDB: QuestionDB) {}

  async create(createQuestionDto: CreateQuestionDto): Promise<Question> {
    return this.questionDB.createQuestionInDB(createQuestionDto);
  }

  async findCollabQuestion(
    collabQuestionDto: CollabQuestionDto,
  ): Promise<Question | null> {
    const question =
      await this.questionDB.findCollabQuestionInDB(collabQuestionDto);

    if (!question) {
      throw new NotFoundException(
        'No question found, Please try a different category or complexity'
      );
    }
    return question;
  }

  async findAll(filterDto: FilterQuestionDto): Promise<Partial<Question>[]> {
    return this.questionDB.findAllQuestionsInDB(filterDto);
  }

  async findById(questionId: string): Promise<Question> {
    return this.questionDB.findOneQuestionInDB(questionId);
  }

  async update(
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    return this.questionDB.updateQuestionInDB(questionId, updateQuestionDto);
  }

  async remove(questionId: string): Promise<Question> {
    return this.questionDB.removeQuestionInDB(questionId);
  }
}
