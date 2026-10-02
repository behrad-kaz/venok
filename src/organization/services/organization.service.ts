import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { OrganizationEntity } from '../entities/organization.entity';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '../dtos/organization.dto';
import { OrganizationQueryDto } from '../dtos/organization-query.dto';
import { UserEntity, UserRole } from '../../user/entities/user.entity';
import { deleteImage, extractFileInfo } from '../../shared/utils/file-utils';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private organizationRepository: Repository<OrganizationEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  private static cleanOrganization(organization: OrganizationEntity | null) {
    if (!organization) return null;

    const { workspaces, ...rest } = organization as any;

    const cleanWorkspaces = (workspaces || []).map((w: any) => {
      const { organization: _o, ...wsRest } = w;
      return wsRest;
    });

    return {
      ...rest,
      workspaces: cleanWorkspaces,
    };
  }

  async findAll(queryParams: OrganizationQueryDto, currentUserId: number) {
    const page = queryParams.page || 1;
    const limit = queryParams.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (queryParams.name) {
      where.name = Like(`%${queryParams.name}%`);
    }
    if (queryParams.slug) {
      where.slug = Like(`%${queryParams.slug}%`);
    }

    const order: any = {};
    if (queryParams.sort) {
      order[queryParams.sort] = queryParams.order || 'DESC';
    } else {
      order.createdAt = queryParams.order || 'DESC';
    }

    const [data, total] = await this.organizationRepository.findAndCount({
      where,
      relations: {
        workspaces: true,
      },
      order,
      skip,
      take: limit,
    });

    return {
      data: data.map((org) => OrganizationService.cleanOrganization(org)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, currentUserId: number) {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: {
        workspaces: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return OrganizationService.cleanOrganization(organization);
  }

  async findBySlug(slug: string) {
    const organization = await this.organizationRepository.findOne({
      where: { slug },
      relations: {
        workspaces: true,
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return OrganizationService.cleanOrganization(organization);
  }

  async findByUser(userId: number) {
    const organizations = await this.organizationRepository.find({
      where: { ownerUserId: userId },
      relations: {
        workspaces: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return organizations.map((org) => OrganizationService.cleanOrganization(org));
  }

  async getOrganizationByUser(userId: number, organizationId?: number) {
    // ✅ ابتدا سعی کن با organizationId از JWT توکن
    if (organizationId) {
      const organization = await this.organizationRepository.findOne({
        where: { id: organizationId },
        relations: {
          workspaces: true,
        },
      });
      if (organization) {
        return OrganizationService.cleanOrganization(organization);
      }
    }

    // ✅ اگر نشد، با ownerUserId جستجو کن
    const organization = await this.organizationRepository.findOne({
      where: { ownerUserId: userId },
      relations: {
        workspaces: true,
      },
    });

    return OrganizationService.cleanOrganization(organization);
  }

  async getCurrentOrganization(userId: number, organizationId?: number) {
    // ✅ ابتدا سعی کن با organizationId از JWT توکن
    if (organizationId) {
      const org = await this.organizationRepository.findOne({
        where: { id: organizationId },
        relations: {
          workspaces: true,
        },
      });
      if (org) {
        return OrganizationService.cleanOrganization(org);
      }
    }

    // ✅ اگر نشد، با ownerUserId جستجو کن
    const organizations = await this.findByUser(userId);
    if (organizations.length === 0) {
      throw new NotFoundException('No organization found for this user');
    }
    return organizations[0];
  }

  async create(body: CreateOrganizationDto, userId: number) {
    const existingOrg = await this.organizationRepository.findOne({
      where: { slug: body.slug },
    });

    if (existingOrg) {
      throw new BadRequestException(`Slug "${body.slug}" already exists`);
    }

    const organization = this.organizationRepository.create({
      ...body,
      ownerUserId: userId,
      status: 'active',
      plan: 'free',
      subscriptionStatus: 'active',
      logo: body.logo || null,
    });

    const saved = await this.organizationRepository.save(organization);

    // ✅ به‌روزرسانی کاربر با organizationId
    await this.userRepository.update(userId, {
      organizationId: saved.id,
    });

    return this.findOne(saved.id, userId);
  }

  async update(
    id: number,
    body: UpdateOrganizationDto,
    userId: number,
    userRole: UserRole,
  ) {
    const organization = await this.findOne(id, userId);

    if (userRole !== UserRole.ADMIN && organization.ownerUserId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this organization',
      );
    }

    if (body.slug && body.slug !== organization.slug) {
      const existingOrg = await this.organizationRepository.findOne({
        where: { slug: body.slug },
      });
      if (existingOrg) {
        throw new BadRequestException(`Slug "${body.slug}" already exists`);
      }
    }

    if (body.logo === null) {
      if (organization.logo) {
        console.log(`🗑️ Deleting logo: ${organization.logo}`);
        const { fileName, folder } = extractFileInfo(organization.logo);
        await deleteImage(fileName, folder);
        organization.logo = null;
      }
    } else if (body.logo && body.logo !== organization.logo) {
      if (organization.logo) {
        console.log(`🗑️ Deleting old logo: ${organization.logo}`);
        const { fileName, folder } = extractFileInfo(organization.logo);
        await deleteImage(fileName, folder);
      }
      organization.logo = body.logo;
    }

    if (body.name !== undefined) organization.name = body.name;
    if (body.legalName !== undefined) organization.legalName = body.legalName;
    if (body.slug !== undefined) organization.slug = body.slug;
    if (body.type !== undefined) organization.type = body.type;
    if (body.legalType !== undefined) organization.legalType = body.legalType;
    if (body.status !== undefined) organization.status = body.status;
    if (body.nationalId !== undefined)
      organization.nationalId = body.nationalId;
    if (body.taxId !== undefined) organization.taxId = body.taxId;
    if (body.website !== undefined) organization.website = body.website;
    if (body.description !== undefined)
      organization.description = body.description;
    if (body.currency !== undefined) organization.currency = body.currency;
    if (body.locale !== undefined) organization.locale = body.locale;

    const saved = await this.organizationRepository.save(organization);
    return this.findOne(saved.id, userId);
  }

  async delete(id: number, userId: number, userRole: UserRole) {
    const organization = await this.findOne(id, userId);

    if (userRole !== UserRole.ADMIN && organization.ownerUserId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this organization',
      );
    }

    if (organization.logo) {
      console.log(`🗑️ Deleting logo: ${organization.logo}`);
      const { fileName, folder } = extractFileInfo(organization.logo);
      await deleteImage(fileName, folder);
    }

    await this.organizationRepository.softDelete(id);

    return { message: 'Organization deleted successfully' };
  }
}