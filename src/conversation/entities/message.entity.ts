import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConversationEntity } from './conversation.entity';
import { StaffEntity } from '../../staff/entities/staff.entity';

export enum MessageSenderType {
  CUSTOMER = 'customer',
  AGENT = 'agent',
  SYSTEM = 'system',
}

@Entity('messages')
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  conversationId: number;

  @Column({
    type: 'enum',
    enum: MessageSenderType,
    default: MessageSenderType.CUSTOMER,
  })
  senderType: MessageSenderType;

  @Column({ type: 'int', nullable: true })
  senderId: number | null;

  @Column({ type: 'varchar', length: 200 })
  senderName: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isInternalNote: boolean;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversationId' })
  conversation: ConversationEntity;

  @ManyToOne(() => StaffEntity)
  @JoinColumn({ name: 'senderId' })
  sender: StaffEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}