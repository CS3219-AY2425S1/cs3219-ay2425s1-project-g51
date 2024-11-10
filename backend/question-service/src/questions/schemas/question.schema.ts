import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { QuestionCategory, QuestionComplexity } from '../types/question.types';

export type QuestionDocument = HydratedDocument<Question>;

export interface TestCase {
  input: string;
  expectedOutput: string;
}

@Schema({ collection: 'questions', timestamps: true })
export class Question {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  //TODO: test this 
  @Prop({ 
    required: true, 
    type: [String],
    enum: QuestionCategory,
    })
  categories: QuestionCategory[];

  @Prop({ 
    required: true,
    type: String,
    enum: QuestionComplexity,})
   complexity: QuestionComplexity;

   @Prop({
    type: [{
      input: { type: String, required: true },
      expectedOutput: { type: String, required: true },
    }],
    default: []
  })
  testCases: TestCase[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
