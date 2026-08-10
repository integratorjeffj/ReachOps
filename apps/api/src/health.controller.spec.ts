import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('identifies the ReachOps API', () => {
    expect(new HealthController().getHealth()).toEqual({
      service: 'reachops-api',
      status: 'ok',
    });
  });
});
