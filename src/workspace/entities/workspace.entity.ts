import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrganizationEntity } from '../../organization/entities/organization.entity';

@Entity('workspaces')
export class WorkspaceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ type: 'int' })
  managerStaffId: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: string;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: string;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Tehran' })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'fa-IR' })
  locale: string;

  @Column({ type: 'varchar', nullable: true })
  logo: string | null; // ← اضافه شد

  @ManyToOne(() => OrganizationEntity, (organization) => organization.workspaces)
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}