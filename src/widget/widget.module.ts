import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WidgetController } from './controllers/widget.controller';
import { WidgetService } from './services/widget.service';
import { WidgetEntity } from './entities/widget.entity';
import { WorkspaceEntity } from '../workspace/entities/workspace.entity';
import { SupportTeamEntity } from '../support/entities/support-team.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WidgetEntity,
      WorkspaceEntity,
      SupportTeamEntity,
    ]),
  ],
  controllers: [WidgetController],
  providers: [WidgetService],
  exports: [WidgetService],
})
export class WidgetModule {}