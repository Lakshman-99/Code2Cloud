import {
  Controller,
  Post,
  Req,
  Res,
  Headers,
  HttpCode,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WebhooksService } from './webhooks.service';


@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('github')
  @HttpCode(200)
  async handleGitHubWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Headers('x-github-delivery') deliveryId: string,
  ) {
    // ── Validate raw body exists ───────────────────────────
    const rawBody = req.rawBody;
    if (!rawBody) {
      this.logger.warn('No raw body available for signature verification');
      return res.status(400).json({ error: 'Missing request body' });
    }

    // ── Verify HMAC signature ──────────────────────────────
    if (!this.webhooksService.verifySignature(rawBody, signature)) {
      this.logger.warn(`Invalid webhook signature (delivery: ${deliveryId})`);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    this.logger.log(`GitHub webhook: ${event} (delivery: ${deliveryId})`);

    // ── Route by event type ────────────────────────────────
    switch (event) {
      case 'push':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        await this.webhooksService.handlePushEvent(req.body);
        break;

      case 'installation':
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.log(`Installation event: ${req.body.action} by ${req.body.sender?.login}`,);
        break;

      case 'ping':
        this.logger.log('Ping received — webhook is configured correctly');
        break;

      default:
        this.logger.debug(`Ignoring event: ${event}`);
    }

    return res.json({ received: true });
  }
}