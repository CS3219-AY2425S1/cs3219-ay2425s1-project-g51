import { Controller, Post, Body } from '@nestjs/common';
import { CodeExecutionService } from './code-execution.service';

@Controller('api/code-execution')
export class CodeExecutionController {
  constructor(private readonly codeExecutionService: CodeExecutionService) {}

  @Post()
  async executeCode(
    @Body() 
    body: {
      sessionId: string;
      questionId: string;
      language: string;
      code: string;
    }
  ) {
    const { sessionId, questionId, language, code } = body;
    await this.codeExecutionService.executeCode(
      sessionId,
      questionId,
      language,
      code
    );
  }
}