import { Module } from '@nestjs/common';
import { CollabRedisService } from './redis.service';

@Module({
  providers: [CollabRedisService],
  exports: [CollabRedisService],
})
export class RedisModule {}
