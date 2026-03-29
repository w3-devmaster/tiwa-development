import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // --- Emit methods for other services ---

  emitAgentStatus(agent: unknown) {
    this.server.emit('agent:status', agent);
  }

  emitTaskUpdate(task: unknown) {
    this.server.emit('task:update', task);
  }

  emitWorkflowUpdate(workflow: unknown) {
    this.server.emit('workflow:update', workflow);
  }

  emitLogEntry(log: unknown) {
    this.server.emit('log:entry', log);
  }

  emitWorkerUpdate(worker: unknown) {
    this.server.emit('worker:update', worker);
  }

  emitWorkerOutput(data: unknown) {
    this.server.emit('worker:output', data);
  }

  emitChatMessage(message: unknown) {
    this.server.emit('chat:message', message);
  }

  emitServiceRestart(data: unknown) {
    this.server.emit('service:restart', data);
  }

  // --- Chat handling ---

  @SubscribeMessage('chat:send')
  handleChatSend(
    @MessageBody() data: { roomId: string; sender: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const message = {
      ...data,
      senderType: 'user',
      timestamp: new Date(),
    };
    this.server.emit('chat:message', message);
    return message;
  }
}
