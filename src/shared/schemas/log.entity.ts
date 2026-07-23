import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum LogType {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

@Entity('logs')
export class LogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  stack: string;

  @Column({ type: 'text', nullable: true })
  path: string;

  @Column({ type: 'text', nullable: true })
  method: string;

  @Column({ type: 'int', nullable: true })
  statusCode: number;

  @Column({ type: 'enum', enum: LogType, default: LogType.Error })
  type: LogType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ type: 'int', nullable: true })
  userId: number;  // ← اضافه کنید

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}