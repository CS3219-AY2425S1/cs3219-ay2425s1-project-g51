import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CodeExecutionController } from './code-execution.controller';
import { CodeExecutionService } from './code-execution.service';
import { CodeExecutionProcessor } from './code-execution.processor';
import * as dotenv from 'dotenv';
import { HttpModule } from '@nestjs/axios';

dotenv.config();

@Module({
  imports: [
    HttpModule,
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'code-execution',
    }),
  ],
  controllers: [CodeExecutionController],
  providers: [CodeExecutionService, CodeExecutionProcessor],
})
export class CodeExecutionModule {}