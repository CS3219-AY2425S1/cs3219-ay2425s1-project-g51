import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { EditorService } from './editor.service';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { QuestionSubmission } from './schemas/question-submission.schema';
import { Session } from './schemas/session.schema';
import { EditorGateway } from './editor.gateway';

@Controller('submissions')
export class EditorController {
  constructor(
    private readonly editorService: EditorService,
    private readonly editorGateway: EditorGateway,
  ) {}

  @Get(':sessionId/:questionId')
  async getLastSubmission(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
  ): Promise<QuestionSubmission | null> {
    return this.editorService.getLastSubmissionExecutionResult(
      sessionId,
      questionId,
    );
  }

  @Patch(':sessionId/:questionId')
  async updateSubmission(
    @Param('sessionId') sessionId: string,
    @Param('questionId') questionId: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto,
  ): Promise<QuestionSubmission> {
    const questionSubmission = await this.editorService.updateLastSubmission(
      sessionId,
      questionId,
      updateSubmissionDto.status,
      updateSubmissionDto.executionResults,
    );

    this.editorGateway.notifySubmissionMade(sessionId, questionId, questionSubmission);

    return questionSubmission;
  }

  @Get(':sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
  ): Promise<Session | null> {
    return this.editorService.getSession(sessionId);
  }

  @Get()
  async getAllSessions(): Promise<Session[]> {
    return this.editorService.getAllSessions();
  }
}