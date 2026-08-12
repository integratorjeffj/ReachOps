import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@reachops/database';

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
