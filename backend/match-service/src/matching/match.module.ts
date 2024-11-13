import { Module } from '@nestjs/common';
import { MatchGateway } from './match.gateway';
import { MatchService } from './match.service';
import { RedisService } from '../redis/redis.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [RedisService, MatchGateway, MatchService],
})
export class MatchModule { }
