import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthService, HealthCheckResult } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('live')
  @HttpCode(HttpStatus.OK)
  liveness() {
    return this.healthService.checkLiveness();
  }

  @Get('ready')
  async readiness(@Res() res: Response) {
    const result = await this.healthService.checkReadiness();

    if (result.status === 'ready') {
      return res.status(HttpStatus.OK).json(result);
    }

    return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(result);
  }

  @Get()
  async health(@Res() res: Response): Promise<Response<HealthCheckResult>> {
    const result = await this.healthService.getFullHealth();

    const statusCode =
      result.status === 'unhealthy' ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.OK;

    return res.status(statusCode).json(result);
  }

  @Get('startup')
  async startup(@Res() res: Response) {
    const result = await this.healthService.checkReadiness();

    if (result.status === 'ready') {
      return res.status(HttpStatus.OK).json(result);
    }

    return res.status(HttpStatus.SERVICE_UNAVAILABLE).json(result);
  }
}
