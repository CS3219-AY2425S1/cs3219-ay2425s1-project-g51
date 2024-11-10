import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EditorService } from './editor.service';
import { QuestionSubmission } from './schemas/question-submission.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
  }
})
export class EditorGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly editorService: EditorService) { }

  async handleConnection(client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    const questionId = client.handshake.query.questionId as string;
    const username = client.handshake.query.username as string;
    const username_socket_id = `${username}:${client.id}`
    console.log('Client connected', username_socket_id, sessionId, questionId);

    try {
      await this.editorService.addUserToSession(sessionId, username_socket_id);

      let session = await this.editorService.getSessionIfActive(sessionId);
      if (!session) {
        session = await this.editorService.createSessionIfNotCompleted(sessionId);
      }

      if (session) {
        const questionAttempt = session.questionAttempts.find(
          qa => qa.questionId === questionId
        );

        if (questionAttempt) {
          client.emit('codeChange', {
            code: questionAttempt.currentCode,
            language: questionAttempt.currentLanguage
          });
        } else {
          await this.editorService.createQuestionAttempt(sessionId, questionId);
        }

        let activeUsers = await this.editorService.getActiveUsers(sessionId);
        activeUsers = activeUsers.filter(userId => this.server.sockets.sockets.get(userId.split(':')[1])?.connected ?? false);
        this.editorService.setActiveUsers(sessionId, activeUsers);
        client.join(`${sessionId}:${questionId}`);
        this.server.to(`${sessionId}:${questionId}`).emit('activeUsers', activeUsers);
      }
    } catch (error) {
      console.error('Error in handleConnection:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const sessionId = client.handshake.query.sessionId as string;
    const questionId = client.handshake.query.questionId as string;
    const username = client.handshake.query.username as string;
    const username_socket_id = `${username}:${client.id}`
    console.log('Client disconnected', username_socket_id, sessionId, questionId);

    try {
      await this.editorService.removeUserFromSession(sessionId, username_socket_id);
      let activeUsers = await this.editorService.getActiveUsers(sessionId);
      this.server.to(`${sessionId}:${questionId}`).emit('activeUsers', activeUsers);
      client.leave(`${sessionId}:${questionId}`);
    } catch (error) {
      console.error('Error in handleDisconnect:', error);
    }
  }

  @SubscribeMessage('codeChange')
  async handleCodeChange(client: Socket, payload: CodeChangePayload) {
    const { sessionId, questionId, code, language } = payload;

    try {
      await this.editorService.updateQuestionCode(sessionId, questionId, code, language);
      client.to(`${sessionId}:${questionId}`).emit('codeChange', { code, language });
    } catch (error) {
      console.error('Error in handleCodeChange:', error);
      client.emit('error', 'Failed to update code');
    }
  }

  @SubscribeMessage('submitCode')
  async handleSubmission(client: Socket, payload: SubmissionPayload) {
    const { sessionId, questionId, code, language } = payload;

    try {
      await this.editorService.submitQuestionAttempt(sessionId, questionId, {
        code,
        language,
      });

      this.server.to(`${sessionId}:${questionId}`).emit('submissionMade', {
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error in handleSubmission:', error);
      client.emit('error', 'Failed to submit code');
    }
  }

  async notifySubmissionMade(sessionId: string, questionId: string, submission: QuestionSubmission) {
    this.server.to(`${sessionId}:${questionId}`).emit('submissionResults', submission);
  }
}