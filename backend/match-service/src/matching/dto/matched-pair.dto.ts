import { QuestionComplexity } from "../../../../question-service/src/questions/types/question.types";

export class MatchedPairDto {
  matchId: string;
  user1: {
    userId: string;
    socketId: string;
  };
  user2: {
    userId: string;
    socketId: string;
  };
  topic: string;
  difficulty: QuestionComplexity;
  timestamp: number;
}