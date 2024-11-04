import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class QuestionSubmission {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  language: string;

  @Prop()
  submittedAt: Date;

  @Prop({ type: String, default: 'pending' })
  status: 'pending' | 'accepted' | 'rejected';
}

export const QuestionSubmissionSchema = SchemaFactory.createForClass(QuestionSubmission);