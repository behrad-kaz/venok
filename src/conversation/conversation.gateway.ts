import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { CreateMessageDto } from './dtos/message.dto';
import { MessageEntity } from './entities/message.entity';
import { UserRole } from '../user/entities/user.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
@Injectable()
export class ConversationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private conversationRooms: Map<string, Set<string>> = new Map();
  private socketConversations: Map<string, string> = new Map();

  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
    
    const token = client.handshake.auth.token;
    if (!token) {
      console.log(`ℹ️ Client ${client.id} connected without token (widget)`);
    } else {
      console.log(`✅ Client authenticated: ${client.id}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Client disconnected: ${client.id}`);
    
    const conversationId = this.socketConversations.get(client.id);
    if (conversationId) {
      const room = this.conversationRooms.get(conversationId);
      if (room) {
        room.delete(client.id);
        if (room.size === 0) {
          this.conversationRooms.delete(conversationId);
        }
      }
      this.socketConversations.delete(client.id);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const { conversationId } = data;
    console.log(`📩 Client ${client.id} joining conversation: ${conversationId}`);

    this.socketConversations.set(client.id, conversationId);
    
    if (!this.conversationRooms.has(conversationId)) {
      this.conversationRooms.set(conversationId, new Set());
    }
    this.conversationRooms.get(conversationId)?.add(client.id);
    
    client.join(`conversation_${conversationId}`);

    try {
      const messages: MessageEntity[] = await this.messageService.getConversationMessages(
        parseInt(conversationId),
        0,
        'user' as any,
      );
      
      const formattedMessages = messages.map((msg: MessageEntity) => ({
        id: msg.id,
        text: msg.content,
        senderType: msg.senderType,
        timestamp: msg.createdAt,
        isInternal: msg.isInternalNote,
        senderName: msg.senderName,
      }));
      
      client.emit('conversation_joined', {
        conversationId,
        messages: formattedMessages,
      });
      
      console.log(`✅ Sent ${formattedMessages.length} messages to client ${client.id}`);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      client.emit('error', { message: 'Failed to fetch messages' });
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { 
      conversationId: string; 
      text: string; 
      isInternal?: boolean;
    },
  ) {
    const { conversationId, text, isInternal = false } = data;
    console.log(`💬 Message from ${client.id} in ${conversationId}: ${text}`);

    try {
      const createMessageDto: CreateMessageDto = {
        content: text,
        isInternalNote: isInternal,
      };

      // ✅ ذخیره پیام در دیتابیس
      const message: MessageEntity = await this.messageService.createMessage(
        parseInt(conversationId),
        createMessageDto,
        0,
        'user' as any,
        'مشتری',
      );

      // ✅ ارسال پیام به همه اعضای room (هم مشتری و هم پشتیبانی)
      this.server.to(`conversation_${conversationId}`).emit('new_message', {
        id: message.id,
        text: message.content,
        senderType: message.senderType,
        timestamp: message.createdAt,
        isInternal: message.isInternalNote,
        senderName: message.senderName,
      });

      console.log(`✅ Message sent to conversation ${conversationId}`);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  // ✅ متد جدید: ارسال پیام از سمت پشتیبانی (Admin/Manager/Staff)
  async sendSupportMessage(conversationId: number, text: string, senderName: string, senderId: number) {
    try {
      const createMessageDto: CreateMessageDto = {
        content: text,
        isInternalNote: false,
      };

      // ✅ ذخیره پیام در دیتابیس
      const message: MessageEntity = await this.messageService.createMessage(
        conversationId,
        createMessageDto,
        senderId,
        'admin' as any,
        senderName,
      );

      // ✅ ارسال پیام به همه اعضای room (هم مشتری و هم پشتیبانی)
      this.server.to(`conversation_${conversationId}`).emit('new_message', {
        id: message.id,
        text: message.content,
        senderType: 'agent',
        timestamp: message.createdAt,
        isInternal: message.isInternalNote,
        senderName: senderName,
      });

      console.log(`✅ Support message sent to conversation ${conversationId}`);
      return message;
    } catch (error) {
      console.error('❌ Error sending support message:', error);
      throw error;
    }
  }
}