
import { ExecutionResults } from "../schemas/question-submission.schema";

export class UpdateSubmissionDto {
  status: 'pending' | 'accepted' | 'rejected';
  executionResults: ExecutionResults;
}