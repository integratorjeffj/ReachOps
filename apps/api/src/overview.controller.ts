import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import type { OverviewResponse } from '@reachops/contracts';
import { OverviewNotFoundError, OverviewQueryService } from '@reachops/database';

@Controller('workspaces/:workspaceSlug/overview')
export class OverviewController {
  constructor(private readonly overviewQuery: OverviewQueryService) {}

  @Get()
  async getOverview(
    @Param('workspaceSlug') workspaceSlug: string,
    @Headers('x-reachops-demo-user-id') demoUserId: string | undefined,
  ): Promise<OverviewResponse> {
    if (
      process.env.DEMO_AUTH_ENABLED !== 'true' ||
      process.env.NODE_ENV === 'production' ||
      !demoUserId
    ) {
      throw new UnauthorizedException({
        code: 'DEMO_IDENTITY_REQUIRED',
        message: 'An explicitly enabled development demo identity is required.',
      });
    }

    try {
      return await this.overviewQuery.getOverview({
        workspaceSlug,
        actorUserId: demoUserId,
      });
    } catch (error) {
      if (error instanceof OverviewNotFoundError) {
        throw new NotFoundException({
          code: 'OVERVIEW_NOT_FOUND',
          message: 'The overview is not available for the current identity.',
        });
      }
      throw error;
    }
  }
}
