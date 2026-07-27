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

@Entity('widgets')
export class WidgetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  workspaceId: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  widgetToken: string;

  @Column({ type: 'varchar', length: 200 })
  companyName: string;

  @Column({ type: 'varchar', nullable: true })
  logoUrl: string | null;

  @Column({ type: 'varchar', length: 20, default: '#14b8a6' })
  primaryColor: string;

  @Column({ type: 'varchar', length: 20, default: 'bottom-right' })
  buttonPosition: string;

  @Column({ type: 'varchar', length: 20, default: 'md' })
  buttonSize: string;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'چطور می‌تونیم کمکتون کنیم؟',
  })
  formTitle: string;

  @Column({
    type: 'varchar',
    length: 500,
    default: 'موضوع گفتگو را انتخاب کنید تا شما را به تیم مناسب وصل کنیم.',
  })
  formDescription: string;

  @Column({
    type: 'varchar',
    length: 100,
    default: 'شماره همراه خود را وارد کنید',
  })
  phonePlaceholder: string;

  @Column({ type: 'varchar', length: 100, default: 'شروع گفتگو' })
  submitButtonText: string;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'لینک گفتگو برای شما پیامک شد.',
  })
  successMessage: string;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'با ثبت شماره، لینک گفتگو از طریق پیامک برای شما ارسال می‌شود.',
  })
  privacyText: string;

  @Column({ type: 'boolean', default: true })
  showDepartmentSelect: boolean;

  @Column({ type: 'boolean', default: true })
  showDescriptionField: boolean;

  @Column({ type: 'boolean', default: false })
  descriptionRequired: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: [] })
  allowedDomains: string[];

  @Column({ type: 'jsonb', default: [] })
  supportTeamIds: number[];

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'int', nullable: true })
  updatedBy: number;

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
