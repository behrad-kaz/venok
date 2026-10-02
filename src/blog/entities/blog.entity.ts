import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BlogCategoryEntity } from './blog-category.entity';

@Entity('blogs')
export class BlogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })  // ← nullable: true اضافه کنید
  url: string;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @ManyToOne(() => BlogCategoryEntity)
  @JoinColumn({ name: 'categoryId' })
  category: BlogCategoryEntity;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'int', nullable: true })
  updatedBy: number;

  @Column({ type: 'int', nullable: true })
  deletedBy: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}