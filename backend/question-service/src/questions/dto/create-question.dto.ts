import { ArrayNotEmpty, ArrayUnique, IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { QuestionCategory, QuestionComplexity } from '../types/question.types';

export class CreateQuestionDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(QuestionCategory, { each: true })
  categories: QuestionCategory[];

  @IsEnum(QuestionComplexity)
  complexity: QuestionComplexity;

  @IsArray()
  testCases: { input: string; expectedOutput: string }[];
  
}