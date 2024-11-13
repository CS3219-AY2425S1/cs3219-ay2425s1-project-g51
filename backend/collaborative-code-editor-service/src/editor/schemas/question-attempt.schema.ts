import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { QuestionSubmission, QuestionSubmissionSchema } from './question-submission.schema';

@Schema({ timestamps: true })
export class QuestionAttempt {
  @Prop({ required: true })
  questionId: string;

  @Prop({ type: [QuestionSubmissionSchema] })
  submissions: QuestionSubmission[];

  @Prop()
  startedAt: Date;

  @Prop()
  currentCode: string;

  @Prop({ default: 'javascript' })
  currentLanguage: string;
}

export const QuestionAttemptSchema = SchemaFactory.createForClass(QuestionAttempt);
