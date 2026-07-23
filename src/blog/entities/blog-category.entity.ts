import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { BlogEntity } from './blog.entity';

@Entity('categories')
export class BlogCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })  // ← nullable: true اضافه کنید
  url: string;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'int', nullable: true })
  updatedBy: number;

  @Column({ type: 'int', nullable: true })
  deletedBy: number;

  @OneToMany(() => BlogEntity, (blog) => blog.category)
  blogs: BlogEntity[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date;
}