import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RedisService } from '../redis/redis.service';
import { MatchRequestDto } from './dto/match-request.dto';
import { MatchedPairDto } from './dto/matched-pair.dto';
import { MatchResult } from './interfaces/match-result.interface';
import { v4 as uuidv4 } from 'uuid';
import { QuestionComplexity } from '../../../question-service/src/questions/types/question.types';
import { WebSocketServer } from '@nestjs/websockets';
import { timestamp } from 'rxjs';

@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);
  private readonly MATCH_TIMEOUT = 30000;
  private readonly SAME_DIFFICULTY_TIMEOUT = 20000;

  constructor(private readonly redisService: RedisService) {}

  async handleMatchRequest(matchRequest: MatchRequestDto, client: Socket) {
    try {
      const request = {
        ...matchRequest,
        timestamp: Date.now(),
        socketId: client.id,
      };

      // Check if user already has an active request
      const hasActiveRequest = await this.redisService.checkUserHasActiveRequest(request.userId);
      if (hasActiveRequest) {
        client.emit('matchResult', {
          success: false,
          message: 'User already has an active match request',
        } as MatchResult);
        return;
      }

      // Add request to Redis
      await this.redisService.addMatchRequest(request);

      // Try to find a match immediately
      await this.findMatch(request, client);

      // Set up timeout for match
      setTimeout(async () => {
        try {
          this.logger.log(`Match request timed out: ${request.userId}`);
          const hasRequest = await this.redisService.checkUserHasActiveRequest(request.userId);
          if (!hasRequest) return;
          this.logger.log(`Removing match request: ${request.userId}`);

          // Remove the request if it's still in Redis
          await this.redisService.removeMatchRequest(request.userId);
          
          // Notify user if they haven't been matched yet
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

  private async findMatch(request: MatchRequestDto & { socketId: string }, client: Socket) {
    try {
      // Find potential matches with the same topic
      const potentialMatches = await this.redisService.findPotentialMatches(request.topic, request.userId);
      potentialMatches.sort((a, b) => a.timestamp - b.timestamp);
      
      if (potentialMatches.length !== 0) {
        // First, look for exact matches (same topic and difficulty)
        const exactMatch = potentialMatches.find(
          match => match.difficulty === request.difficulty
        );

        if (exactMatch) {
          // Create immediate match
          await this.createMatch(request, exactMatch, client);
          return;
        }

        const timeToExpiry = this.MATCH_TIMEOUT - (Date.now() - potentialMatches[0].timestamp);
        if (timeToExpiry < this.MATCH_TIMEOUT - this.SAME_DIFFICULTY_TIMEOUT) {
          await this.createMatch(request, potentialMatches[0], client);
          return;
        }
      }

      // If no exact match, wait briefly for potential exact matches
      setTimeout(async () => {
        this.logger.log(`SAME DIFFICULTY TIMEOUT invoked: ${request.userId}`);
        const hasRequest = await this.redisService.checkUserHasActiveRequest(request.userId);
        if (!hasRequest) return;
        this.logger.log(`SAME DIFFICULTY TIMEOUT invoked and user has active request: ${request.userId}`);

        // Check again for matches
        const updatedMatches = await this.redisService.findPotentialMatches(request.topic, request.userId);
        const newExactMatch = updatedMatches.find(
          match => match.difficulty === request.difficulty
        );

        if (newExactMatch) {
          // Create immediate match
          await this.createMatch(request, newExactMatch, client);
          return;
        } else if (updatedMatches.length > 0) {
          // Match with the first available user
          await this.createMatch(request, updatedMatches[0], client);
        }
      }, this.SAME_DIFFICULTY_TIMEOUT);

    } catch (error) {
      this.logger.error('Error finding match:', error);
    }
  }

  private getMinimumDifficulty(difficulty1: QuestionComplexity, difficulty2: QuestionComplexity) {
    if (difficulty1 === difficulty2) {
      return difficulty1;
    } else if (difficulty1 === QuestionComplexity.EASY || difficulty2 === QuestionComplexity.EASY) {
      return QuestionComplexity.EASY;
    } else if (difficulty1 === QuestionComplexity.MEDIUM || difficulty2 === QuestionComplexity.MEDIUM) {
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
        difficulty: this.getMinimumDifficulty(request1.difficulty, request2.difficulty),
      };

      // Create the match in Redis
      await this.redisService.createMatch(matchedPair);

      const server = global.io;
      
      // Notify both users
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

    } catch (error) {
      this.logger.error('Error creating match:', error);
    }
  }

  async cancelMatch(userId: string, socketId: string) {
    try {
      await this.redisService.removeMatchRequest(userId);
      const server = global.io;
      server.to(socketId).emit('matchResult', {
        success: false,
        message: 'Match request cancelled',
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