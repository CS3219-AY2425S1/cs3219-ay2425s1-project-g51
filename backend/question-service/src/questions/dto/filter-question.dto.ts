
import { IsOptional, IsEnum, IsArray, ArrayNotEmpty, ArrayUnique } from 'class-validator';
import { QuestionCategory, QuestionComplexity } from '../types/question.types';

export class FilterQuestionDto {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(QuestionCategory, { each: true })
  categories?: QuestionCategory[];

  @IsOptional()
  @IsEnum(QuestionComplexity)
  complexity?: QuestionComplexity;
}
