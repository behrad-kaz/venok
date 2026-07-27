import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { WorkspaceEntity } from '../../workspace/entities/workspace.entity';

@Entity('organizations')
export class OrganizationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  ownerUserId: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  legalName: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 50, default: 'company' })
  type: string;

  @Column({ type: 'varchar', length: 50, default: 'individual' })
  legalType: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  logo: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nationalId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  taxId: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  website: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 10, default: 'IRR' })
  currency: string;

  @Column({ type: 'varchar', length: 10, default: 'fa-IR' })
  locale: string;

  @Column({ type: 'varchar', length: 50, default: 'free' })
  plan: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  subscriptionStatus: string;

  @OneToMany(() => WorkspaceEntity, (workspace) => workspace.organization)
  workspaces: WorkspaceEntity[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}