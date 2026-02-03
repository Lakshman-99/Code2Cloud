import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private config: ConfigService
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const workerApiKey = request.headers['x-worker-api-key'] as string;

    // If worker API key is provided, validate it
    if (workerApiKey) {
      const validApiKey = this.config.get<string>('WORKER_API_KEY');
      if (validApiKey && workerApiKey === validApiKey) {
        return true; // Worker authenticated
      }
      throw new UnauthorizedException('Invalid worker API key');
    }

    // Otherwise, fall back to JWT authentication
    return super.canActivate(context) as Promise<boolean>;
  }
}