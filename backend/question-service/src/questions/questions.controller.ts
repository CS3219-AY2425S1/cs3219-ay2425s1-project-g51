import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { Question } from './schemas/question.schema';
import { QuestionCategory, QuestionComplexity } from './types/question.types';
import { FilterQuestionDto } from './dto/filter-question.dto';
import { CollabQuestionDto } from './dto/collab-question.dto';

@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    try {
      return await this.questionsService.create(createQuestionDto);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to create question`);
    }
  }

  @Post('collab')
  async findQuestionByCriteria(
    @Body() collabQuestionDto: CollabQuestionDto,
  ): Promise<Question | null> {
    try {
      return await this.questionsService.findCollabQuestion(collabQuestionDto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw new InternalServerErrorException(
        'Failed to fetch question for collaboration.',
      );
    }
  }

  @Get()
  async findAll(
    @Query('categories') categories?: QuestionCategory[],
    @Query('complexity') complexity?: QuestionComplexity
  ): Promise<Partial<Question>[]> {
    try {
      const filterDto: FilterQuestionDto = {};

      if (categories) {
        filterDto.categories = Array.isArray(categories) 
          ? categories 
          : [categories];
      }

      if (complexity) {
        filterDto.complexity = complexity;
      }
      return await this.questionsService.findAll(filterDto);
    } catch (error) {
      throw new InternalServerErrorException(`Failed to find questions`);
    }
  }

  @Get(':questionId')
  async findOne(@Param('questionId') questionId: string): Promise<Question> {
    try {
      return await this.questionsService.findById(questionId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to find question with ID ${questionId}`);
    }
  }

  @Patch(':questionId')
  async update(
    @Param('questionId') questionId: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    try {
      return await this.questionsService.update(questionId, updateQuestionDto);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to update question with ID ${questionId}`);
    }
  }

  @Delete(':questionId')
  async remove(@Param('questionId') questionId: string): Promise<Question> {
    try {
      return await this.questionsService.remove(questionId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to delete question with ID ${questionId}`);
    }
  }
}
