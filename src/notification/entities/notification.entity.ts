import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';

export enum NotificationType {
  WARNING = 'warning',
  INFO = 'info',
  DANGER = 'danger',
}

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: NotificationType.INFO,
  })
  type: NotificationType;

  @Column({ type: 'int' })
  workspaceId: number;

  @Column({ type: 'int', nullable: true })
  recipientId: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  buttonText: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  buttonLink: string | null;

  @Column({ type: 'boolean', default: false })
  isRead: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  fingerprint: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @ManyToOne(() => WorkspaceEntity)
  @JoinColumn({ name: 'workspaceId' })
  workspace: WorkspaceEntity;
}
