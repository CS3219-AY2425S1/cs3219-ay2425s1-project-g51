import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { QuestionCategory, QuestionComplexity } from '../types/question.types';

export class CollabQuestionDto {
  @IsEnum(QuestionComplexity)
  complexity: QuestionComplexity;

  @IsEnum(QuestionCategory, { each: true })
  category: QuestionCategory;

  @IsArray()
  idsToExclude?: string[];
}
