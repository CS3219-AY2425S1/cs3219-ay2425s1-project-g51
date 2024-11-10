import { Controller, Post, Body, Param } from '@nestjs/common';
import { CollabService } from './collaboration.service';

@Controller('collaboration')
export class CollabController {
  constructor(private readonly collabService: CollabService) {}

  @Post('create-session/:matchId')
  async createSession(
    @Param('matchId') matchId: string,
    @Body() body: { topic: string; difficulty: string; userIds: string[] },
  ) {
    const { topic, difficulty, userIds } = body;

    const initQuestion = await this.collabService.createSessionRecord(
      matchId,
      difficulty,
      topic,
      userIds,
    );

    return {
      matchId,
      initQuestion,
    };
  }
}
