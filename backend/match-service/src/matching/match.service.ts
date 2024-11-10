import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { MatchRequestDto } from './dto/match-request.dto';
import { MatchedPairDto } from './dto/matched-pair.dto';
import { MatchResult } from './interfaces/match-result.interface';
import { v4 as uuidv4 } from 'uuid';
import { QuestionComplexity } from './types/question.types';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  private readonly MATCH_TIMEOUT = 30000;
  private readonly SAME_DIFFICULTY_TIMEOUT = 20000;

  constructor(
    private readonly redisService: RedisService,
    private readonly httpService: HttpService,
  ) {}

  async handleMatchRequest(matchRequest: MatchRequestDto, client: Socket) {
    try {
      const request = {
        ...matchRequest,
        timestamp: Date.now(),
        socketId: client.id,
      };

      const hasActiveRequest =
        await this.redisService.checkUserHasActiveRequest(request.userId);
      if (hasActiveRequest) {
        client.emit('matchResult', {
          success: false,
          message: 'User already has an active match request',
        } as MatchResult);
        return;
      }

      await this.redisService.addMatchRequest(request);

      await this.findMatch(request, client);

      setTimeout(async () => {
        try {
          const hasRequest = await this.redisService.checkRequestExists(
            request.userId,
            request.timestamp,
          );
          if (!hasRequest) return;
          this.logger.log(`Match request timed out: ${request.userId}`);

          await this.redisService.removeMatchRequest(request.userId);

          client.emit('matchResult', {
            success: false,
            message: 'No match found within the timeout period',
          } as MatchResult);
        } catch (error) {
          this.logger.error('Error handling match timeout:', error);
        }
      }, this.MATCH_TIMEOUT);
    } catch (error) {
      this.logger.error('Error handling match request:', error);
      client.emit('matchResult', {
        success: false,
        message: 'Internal server error',
      } as MatchResult);
    }
  }

  private async findMatch(
    request: MatchRequestDto & { socketId: string },
    client: Socket,
  ) {
    try {
      const potentialMatches = await this.redisService.findPotentialMatches(
        request.topic,
        request.userId,
      );
      potentialMatches.sort((a, b) => a.timestamp - b.timestamp);

      if (potentialMatches.length !== 0) {
        const exactMatch = potentialMatches.find(
          (match) => match.difficulty === request.difficulty,
        );

        if (exactMatch) {
          await this.createMatch(request, exactMatch, client);
          return;
        }

        const timeToExpiry =
          this.MATCH_TIMEOUT - (Date.now() - potentialMatches[0].timestamp);
        if (timeToExpiry < this.MATCH_TIMEOUT - this.SAME_DIFFICULTY_TIMEOUT) {
          await this.createMatch(request, potentialMatches[0], client);
          return;
        }
      }

      setTimeout(async () => {
        const hasRequest = await this.redisService.checkRequestExists(
          request.userId,
          request.timestamp,
        );
        if (!hasRequest) return;
        this.logger.log(`SAME DIFFICULTY TIMEOUT invoked: ${request.userId}`);

        const updatedMatches = await this.redisService.findPotentialMatches(
          request.topic,
          request.userId,
        );
        const newExactMatch = updatedMatches.find(
          (match) => match.difficulty === request.difficulty,
        );

        if (newExactMatch) {
          await this.createMatch(request, newExactMatch, client);
          return;
        } else if (updatedMatches.length > 0) {
          await this.createMatch(request, updatedMatches[0], client);
        }
      }, this.SAME_DIFFICULTY_TIMEOUT);
    } catch (error) {
      this.logger.error('Error finding match:', error);
    }
  }

  private getMinimumDifficulty(
    difficulty1: QuestionComplexity,
    difficulty2: QuestionComplexity,
  ) {
    if (difficulty1 === difficulty2) {
      return difficulty1;
    } else if (
      difficulty1 === QuestionComplexity.EASY ||
      difficulty2 === QuestionComplexity.EASY
    ) {
      return QuestionComplexity.EASY;
    } else if (
      difficulty1 === QuestionComplexity.MEDIUM ||
      difficulty2 === QuestionComplexity.MEDIUM
    ) {
      return QuestionComplexity.MEDIUM;
    }
    return QuestionComplexity.HARD;
  }

  private async createMatch(
    request1: MatchRequestDto & { socketId: string },
    request2: MatchRequestDto & { socketId: string },
    client: Socket,
  ) {
    try {
      const matchId = uuidv4();
      const matchedPair: MatchedPairDto = {
        matchId,
        user1: {
          userId: request1.userId,
          socketId: request1.socketId,
        },
        user2: {
          userId: request2.userId,
          socketId: request2.socketId,
        },
        topic: request1.topic,
        timestamp: Date.now(),
        difficulty: this.getMinimumDifficulty(
          request1.difficulty,
          request2.difficulty,
        ),
      };

      await this.redisService.createMatch(matchedPair);

      const server = global.io;

      const parseTopic =
        request1.topic.charAt(0).toUpperCase() + request1.topic.slice(1);

      server.to(request1.socketId).emit('matchResult', {
        success: true,
        message: 'Match found!',
        matchId,
        difficulty: matchedPair.difficulty,
        peerUserId: request2.userId,
      } as MatchResult);

      server.to(request2.socketId).emit('matchResult', {
        success: true,
        message: 'Match found!',
        matchId,
        difficulty: matchedPair.difficulty,
        peerUserId: request1.userId,
      } as MatchResult);

      const collabRequestBody = {
        topic: parseTopic,
        difficulty: matchedPair.difficulty,
        userIds: [request1.userId, request2.userId],
      };
      this.logger.debug(`collab request body: ${collabRequestBody}`);

      const collab_url = process.env.COLLAB_SERVICE_URL;
      this.logger.log(`Public collab url: ${collab_url}`);

      const collabResponse = await this.httpService
        .post(
          `${collab_url}/collaboration/create-session/${matchId}`,
          collabRequestBody,
        )
        .toPromise();

      this.logger.log(`Collab endpoint called: ${collabResponse}`);

      this.logger.log(
        `Match created: ${matchedPair.user1.userId} and ${matchedPair.user2.userId} in ${matchedPair.difficulty} difficulty and ${matchedPair.topic}`,
      );
    } catch (error) {
      this.logger.error('Error creating match:', error);
    }
  }

  async cancelMatch(userId: string, socketId: string) {
    try {
      await this.redisService.removeMatchRequest(userId);
      const server = global.io;
      server.to(socketId).emit('matchResult', {
        success: true,
        message: 'Match request cancelled (if any)',
      } as MatchResult);
    } catch (error) {
      this.logger.error('Error cancelling match:', error);
      throw error;
    }
  }

  async handleDisconnect(socketId: string) {
    try {
      await this.redisService.removeMatchRequestBySocketId(socketId);
    } catch (error) {
      this.logger.error('Error handling disconnect:', error);
      throw error;
    }
  }
}
