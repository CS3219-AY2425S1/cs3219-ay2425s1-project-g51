export class ExecuteCodeDto {
  language: string;
  code: string;
  input?: string;
}

export class ExecuteCodeWithTestsDto {
  questionId: string;
  language: string;
  code: string;
}