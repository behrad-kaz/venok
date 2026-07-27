import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';
import { SupportTeamEntity } from '../../support/entities/support-team.entity';
import { StaffEntity } from '../../staff/entities/staff.entity';
import { MessageEntity } from './message.entity';

export enum ConversationStatus {
  OPEN = 'open',
  WAITING = 'waiting',
  ANSWERED = 'answered',
  CLOSED = 'closed',
}

export enum ConversationPriority {
  NORMAL = 'normal',
  URGENT = 'urgent',
}

export enum ConversationSource {
  WIDGET = 'widget',
  EMAIL = 'email',
  PHONE = 'phone',
}

@Entity('conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  workspaceId: number;

  @Column({ type: 'varchar', nullable: true })
  teamId: number | null;

  @Column({ type: 'int', nullable: true })
  agentId: number | null;

  @Column({ type: 'varchar', length: 200 })
  customerName: string;

  @Column({ type: 'varchar', length: 20 })
  customerPhone: string;

  @Column({ type: 'varchar', length: 200 })
  subject: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.OPEN,
  })
  status: ConversationStatus;

  @Column({
    type: 'enum',
    enum: ConversationSource,
    default: ConversationSource.WIDGET,
  })
  source: ConversationSource;

  @Column({
    type: 'enum',
    enum: ConversationPriority,
    default: ConversationPriority.NORMAL,
  })
  priority: ConversationPriority;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActivity: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'int', nullable: true })
  updatedBy: number;

  @Column({ type: 'int', nullable: true })
  closedBy: number;

  @ManyToOne(() => WorkspaceEntity)
  @JoinColumn({ name: 'workspaceId' })
  workspace: WorkspaceEntity;

  @ManyToOne(() => SupportTeamEntity)
  @JoinColumn({ name: 'teamId' })
  team: SupportTeamEntity;

  @ManyToOne(() => StaffEntity)
  @JoinColumn({ name: 'agentId' })
  agent: StaffEntity;

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages: MessageEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}