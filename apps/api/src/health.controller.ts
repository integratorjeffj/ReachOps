import { Controller, Get } from '@nestjs/common';

export interface HealthResponse {
  service: 'reachops-api';
  status: 'ok';
}

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return { service: 'reachops-api', status: 'ok' };
  }
}
