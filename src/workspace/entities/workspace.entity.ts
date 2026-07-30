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

  // ============ اطلاعات شرکت ============
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  logo: string | null;

  // ============ اطلاعات پشتیبانی ============
  @Column({ type: 'varchar', length: 20, nullable: true })
  supportPhone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  supportEmail: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  alertPhone: string | null;

  @Column({ type: 'text', nullable: true })
  introText: string | null;

  // ============ ساعات کاری ============
  @Column({ type: 'jsonb', default: {} })
  workingDays: {
    saturday: boolean;
    sunday: boolean;
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
  };

  @Column({ type: 'varchar', length: 10, default: '09:00' })
  workStartTime: string;

  @Column({ type: 'varchar', length: 10, default: '18:00' })
  workEndTime: string;

  @Column({ type: 'text', nullable: true })
  outOfHoursMessage: string | null;

  // ============ اعلان‌ها ============
  @Column({ type: 'boolean', default: true })
  sendLinkSms: boolean;

  @Column({ type: 'boolean', default: true })
  sendOtpForPasswordChange: boolean;

  @Column({ type: 'boolean', default: true })
  notifyManagerForUnanswered: boolean;

  @Column({ type: 'boolean', default: true })
  notifyNewConversations: boolean;

  // ============ امنیت ============
  @Column({ type: 'boolean', default: true })
  requireStrongPassword: boolean;

  @Column({ type: 'boolean', default: true })
  requirePhoneVerificationForPasswordChange: boolean;

  @Column({ type: 'int', default: 60 })
  autoLogoutMinutes: number;


  @Column({ type: 'varchar', length: 50, default: 'Asia/Tehran' })
  timezone: string;

  @Column({ type: 'varchar', length: 10, default: 'fa-IR' })
  locale: string;

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