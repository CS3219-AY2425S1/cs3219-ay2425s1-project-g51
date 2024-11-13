import { Module } from '@nestjs/common';
import { CollabRedisService } from 'src/redis/redis.service';
import { CollabGateway } from './collaboration.gateway';
import { CollabService } from './collaboration.service';
import { HttpModule } from '@nestjs/axios';
import { CollabController } from './collaboration.controller';

@Module({
  imports: [HttpModule],
  controllers: [CollabController],
  providers: [CollabRedisService, CollabGateway, CollabService],
})
export class CollabModule {}
