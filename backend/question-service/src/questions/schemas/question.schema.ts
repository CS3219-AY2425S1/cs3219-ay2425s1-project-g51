import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { QuestionCategory, QuestionComplexity } from '../types/question.types';

export type QuestionDocument = HydratedDocument<Question>;

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
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
