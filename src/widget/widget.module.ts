// ============================================================
// FILE: src/widget/widget.module.ts
// ============================================================
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WidgetController } from './controllers/widget.controller';
import { WidgetService } from './services/widget.service';
import { WidgetEntity } from './entities/widget.entity';
import { WorkspaceEntity } from '../workspace/entities/workspace.entity';
import { SupportTeamEntity } from '../support/entities/support-team.entity';
import { WorkspaceService } from '../workspace/services/workspace.service';
import { OrganizationEntity } from '../organization/entities/organization.entity';
import { UserEntity } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WidgetEntity,
      WorkspaceEntity,
      SupportTeamEntity,
      OrganizationEntity,
      UserEntity,
    ]),
  ],
  controllers: [WidgetController],
  providers: [WidgetService, WorkspaceService],
  exports: [WidgetService],
})
export class WidgetModule {}
// ============================================================