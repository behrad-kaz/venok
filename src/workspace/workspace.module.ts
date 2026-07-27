import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceController } from './controllers/workspace.controller';
import { WorkspaceService } from './services/workspace.service';
import { WorkspaceEntity } from './entities/workspace.entity';
import { OrganizationEntity } from '../organization/entities/organization.entity';
import { UserEntity } from '../user/entities/user.entity';
import { OrganizationService } from '../organization/services/organization.service'; // ✅ اضافه شد

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity, OrganizationEntity, UserEntity]),
  ],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceService,
    OrganizationService, 
  ],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}