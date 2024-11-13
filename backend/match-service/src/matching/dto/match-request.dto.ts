import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, IsOptional } from 'class-validator';
import { QuestionCategory, QuestionComplexity } from '../types/question.types';

export class MatchRequestDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsEnum(QuestionCategory)
  topic: QuestionCategory;

  @IsEnum(QuestionComplexity)
  difficulty: QuestionComplexity;

  @IsNumber()
  @Min(0)
  @IsOptional()
  timestamp?: number;

  @IsString()
  @IsOptional()
  socketId?: string;
}
