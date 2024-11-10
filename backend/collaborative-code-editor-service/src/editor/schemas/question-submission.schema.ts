import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

interface TestResult {
  testCaseNumber: number;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed: boolean;
  error?: string;
  compilationError?: string | null;
}

export interface ExecutionResults {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  testResults: TestResult[];
}

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

  @Prop({
    type: {
      totalTests: { type: Number, required: true },
      passedTests: { type: Number, required: true },
      failedTests: { type: Number, required: true },
      testResults: [{
        testCaseNumber: { type: Number, required: true },
        input: { type: String },
        expectedOutput: { type: String, required: true },
        actualOutput: { type: String },
        passed: { type: Boolean, required: true },
        error: { type: String },
        compilationError: { type: String }
      }]
    },
    _id: false, 
    default: null
  })
  executionResults: ExecutionResults;
}

export const QuestionSubmissionSchema = SchemaFactory.createForClass(QuestionSubmission);
