import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class WorkerApiKeyGuard implements CanActivate {
  constructor(private config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-worker-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('Missing worker API key');
    }

    const validApiKey = this.config.get<string>('WORKER_API_KEY');

    if (!validApiKey || apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid worker API key');
    }

    return true;
  }
}
