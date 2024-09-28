import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question, QuestionDocument } from './schemas/question.schema';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { FilterQuestionDto } from './dto/filter-question.dto';

@Injectable()
export class QuestionDB {
  constructor(
    @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
  ) {}

  async createQuestionInDB(
    createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    const newQuestion = new this.questionModel(createQuestionDto);
    return newQuestion.save();
  }

  async findAllQuestionsInDB(filterDto?: FilterQuestionDto): Promise<Partial<Question>[]> {
    const filterQuery: FilterQuery<QuestionDocument> = {};
  
    if (filterDto?.categories && filterDto.categories.length > 0) {
      filterQuery.categories = { $all: filterDto.categories };
    }
  
    if (filterDto?.complexity) {
      filterQuery.complexity = filterDto.complexity;
    }
  
    const query = this.questionModel.find(filterQuery);
  
    return await query.select('questionId title categories complexity').exec();
  }

  async findOneQuestionInDB(questionId: string): Promise<Question> {
    if (!Types.ObjectId.isValid(questionId)) {
      throw new BadRequestException(`Invalid question ID format`);
    }
    const questionById = await this.questionModel
      .findById( questionId )
      .exec();
    if (!questionById) {
      throw new NotFoundException(
        `There is no question with the ID ${questionId}`,
      );
    }

    return questionById;
  }

  async updateQuestionInDB(
    questionId: string,
    updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    if (!Types.ObjectId.isValid(questionId)) {
      throw new BadRequestException(`Invalid question ID format`);
    }
    const questionToUpdate = await this.questionModel
      .findByIdAndUpdate(questionId, updateQuestionDto, { new: true })
      .exec();
    if (!questionToUpdate) {
      throw new NotFoundException(`There is no question with ID ${questionId}`);
    }

    return questionToUpdate;
  }

  async removeQuestionInDB(questionId: string): Promise<Question> {
    if (!Types.ObjectId.isValid(questionId)) {
      throw new BadRequestException(`Invalid question ID format`);
    }
    const questionToDelete = await this.questionModel
      .findByIdAndDelete(questionId)
      .exec();
    if (!questionToDelete) {
      throw new NotFoundException(`There is no question with ID ${questionId}`);
    }

    return questionToDelete;
  }
}