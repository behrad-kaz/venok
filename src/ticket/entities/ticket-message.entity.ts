import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../user/entities/user.entity';
import { TicketEntity } from './ticket.entity';

export enum MessageType {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system',
}

@Entity('ticket_messages')
export class TicketMessageEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.USER,
  })
  type: MessageType;

  @ManyToOne(() => TicketEntity, (ticket) => ticket.messages)
  @JoinColumn({ name: 'ticketId' })
  ticket: TicketEntity;

  @Column({ type: 'int' })
  ticketId: number;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}