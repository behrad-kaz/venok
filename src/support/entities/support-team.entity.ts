import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';

@Entity('support_teams')
export class SupportTeamEntity {
  @PrimaryGeneratedColumn() // ← تغییر از UUID به عدد خودکار
  id: number;

  @Column({ type: 'int' })
  workspaceId: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, default: '#59D8C3' })
  color: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'int', nullable: true })
  updatedBy: number;

  @Column({ type: 'int', nullable: true })
  deletedBy: number;

  @ManyToOne(() => WorkspaceEntity)
  @JoinColumn({ name: 'workspaceId' })
  workspace: WorkspaceEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}