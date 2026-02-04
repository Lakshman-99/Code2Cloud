import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { deploymentSuccessTemplate } from "./templates/deployment-success";
import { deploymentFailedTemplate } from "./templates/deployment-failed";

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("RESEND_API_KEY");
    this.fromEmail =
      this.configService.get<string>("RESEND_FROM_EMAIL") ||
      "notifications@code2cloud.dev";

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn(
        "RESEND_API_KEY is not defined. Email notifications will be disabled.",
      );
    }
  }

  async sendDeploymentSuccess(
    to: string,
    projectName: string,
    deploymentUrl: string,
    commitMessage?: string,
    authorName?: string,
  ) {
    if (!this.resend) return;

    try {
      await this.resend.emails.send({
        from: `Code2Cloud <${this.fromEmail}>`,
        to,
        subject: `Deployment Successful: ${projectName}`,
        html: deploymentSuccessTemplate(
          projectName,
          deploymentUrl,
          commitMessage,
          authorName,
        ),
      });
      this.logger.log(`Success email sent to ${to} for project ${projectName}`);
    } catch (error) {
      this.logger.error(`Failed to send success email to ${to}`, error);
    }
  }

  async sendDeploymentFailure(
    to: string,
    projectName: string,
    commitMessage?: string,
    authorName?: string,
  ) {
    if (!this.resend) return;

    try {
      await this.resend.emails.send({
        from: `Code2Cloud <${this.fromEmail}>`,
        to,
        subject: `Deployment Failed: ${projectName}`,
        html: deploymentFailedTemplate(
          projectName,
          null,
          commitMessage,
          authorName,
        ),
      });
      this.logger.log(`Failure email sent to ${to} for project ${projectName}`);
    } catch (error) {
      this.logger.error(`Failed to send failure email to ${to}`, error);
    }
  }
}
