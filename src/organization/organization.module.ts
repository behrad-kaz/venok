import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationController } from './controllers/organization.controller';
import { OrganizationService } from './services/organization.service';
import { OrganizationEntity } from './entities/organization.entity';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationEntity, UserEntity])],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}