import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { AppService } from './app.service';
import { CodeExecutionModule } from './code-execution/code-execution.module';

@Module({
  imports: [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  CodeExecutionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
