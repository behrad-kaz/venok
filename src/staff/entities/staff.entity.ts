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
import { UserEntity } from '../../user/entities/user.entity';
import { SupportTeamEntity } from '../../support/entities/support-team.entity';

export enum StaffStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum StaffRole {
  ADMIN = 'admin',
  DEPARTMENT_MANAGER = 'department_manager',
  STAFF = 'staff',
}

@Entity('staff')
export class StaffEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  organizationId: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: StaffStatus,
    default: StaffStatus.ACTIVE,
  })
  status: StaffStatus;

  @Column({
    type: 'enum',
    enum: StaffRole,
    default: StaffRole.STAFF,
  })
  role: StaffRole;

  @Column({ type: 'int', nullable: true })
  departmentId: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastOnlineAt: Date | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'int', nullable: true })
  updatedBy: number;

  @Column({ type: 'int', nullable: true })
  deletedBy: number;

  @ManyToOne(() => OrganizationEntity)
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(() => SupportTeamEntity)
  @JoinColumn({ name: 'departmentId' })
  department: SupportTeamEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;
}
