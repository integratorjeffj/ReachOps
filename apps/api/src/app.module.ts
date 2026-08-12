import { Module } from '@nestjs/common';
import { OverviewQueryService } from '@reachops/database';
import { DatabaseService } from './database.service';
import { HealthController } from './health.controller';
import { OverviewController } from './overview.controller';

@Module({
  controllers: [HealthController, OverviewController],
  providers: [
    DatabaseService,
    {
      provide: OverviewQueryService,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) => new OverviewQueryService(database),
    },
  ],
})
export class AppModule {}
