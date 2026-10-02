import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { BlogCategoryDto } from '../dtos/blog-category.dto';
import { BlogCategoryEntity } from '../entities/blog-category.entity';
import { BlogCategoryQueryDto } from '../dtos/blog-category-query.dto';
import { deleteImage, extractFileInfo } from '../../shared/utils/file-utils';
import { UserEntity } from '../../user/entities/user.entity';

@Injectable()
export class BlogCategoryService {
  constructor(
    @InjectRepository(BlogCategoryEntity)
    private categoryRepository: Repository<BlogCategoryEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findAll(queryParams: BlogCategoryQueryDto) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (queryParams.title) {
      where.title = Like(`%${queryParams.title}%`);
    }
    if (queryParams.url) {
      where.url = Like(`%${queryParams.url}%`);
    }

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    const [data, total] = await this.categoryRepository.findAndCount({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        image: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      order,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: parseInt(id, 10) },
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        image: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(body: BlogCategoryDto, userId: number) {
    const categoryData: Partial<BlogCategoryEntity> = {
      title: body.title,
      description: body.description,
      url: body.url,
      image: body.image || null,
      createdBy: userId,
      createdAt: new Date(),
    };

    const newCategory = this.categoryRepository.create(categoryData);
    const saved = await this.categoryRepository.save(newCategory);
    return this.findOne(saved.id.toString());
  }

  async update(id: string, body: BlogCategoryDto, userId: number) {
    const category = await this.findOne(id);

    if (category.createdBy !== userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (user?.role !== 'admin') {
        throw new NotFoundException('You are not allowed to update this category');
      }
    }

    console.log(`📝 Updating category ${id}`);
    console.log(`📸 Current image: ${category.image}`);
    console.log(`📸 New image: ${body.image}`);

    if (body.image === null) {
      if (category.image) {
        console.log(`🗑️ Deleting image: ${category.image}`);
        const { fileName, folder } = extractFileInfo(category.image);
        await deleteImage(fileName, folder);
        category.image = null;
      }
    } else if (body.image && body.image !== category.image) {
      if (category.image) {
        console.log(`🗑️ Deleting old image: ${category.image}`);
        const { fileName, folder } = extractFileInfo(category.image);
        await deleteImage(fileName, folder);
      }
      category.image = body.image;
    }

    category.title = body.title;
    category.description = body.description;
    category.url = body.url;
    category.updatedBy = userId;
    category.updatedAt = new Date();

    const saved = await this.categoryRepository.save(category);
    console.log(`✅ Category updated successfully`);
    return saved;
  }

  async delete(id: string, userId: number) {
    const category = await this.findOne(id);

    if (category.createdBy !== userId) {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (user?.role !== 'admin') {
        throw new NotFoundException('You are not allowed to delete this category');
      }
    }

    if (category.image) {
      console.log(`🗑️ Deleting image: ${category.image}`);
      const { fileName, folder } = extractFileInfo(category.image);
      await deleteImage(fileName, folder);
    }

    category.deletedBy = userId;
    category.deletedAt = new Date();
    await this.categoryRepository.save(category);

    return {
      message: 'Category deleted successfully',
      deletedBy: userId,
      deletedAt: new Date(),
    };
  }
}