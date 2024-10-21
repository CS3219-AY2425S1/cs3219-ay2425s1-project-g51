import { Module } from '@nestjs/common';
import { MatchGateway } from './match.gateway';
import { MatchService } from './match.service';
import { RedisService } from '../redis/redis.service';

@Module({
  providers: [RedisService, MatchGateway, MatchService],
})
export class MatchModule { }
