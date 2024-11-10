import { Module } from '@nestjs/common';
import { EditorService } from './editor.service';
import { EditorGateway } from './editor.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './schemas/session.schema';
import { EditorController } from './editor.controller';
import { SessionModel } from './session.model';
import { SessionCache } from './session.cache';

@Module({
  imports: [MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }])],
  controllers: [EditorController],
  providers: [EditorGateway, EditorService, SessionModel, SessionCache],
})
export class EditorModule {}
