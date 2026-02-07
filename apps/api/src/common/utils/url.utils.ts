import { urlConfig } from "lib/url-config";
import * as crypto from "crypto";

export class UrlUtils {

  static sanitize(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  static generateDeploymentUrl(projectName: string, length = 6): string {
    const sanitizedName = this.sanitize(projectName);
    const hash = crypto
      .randomBytes(Math.ceil(length / 2))
      .toString("hex")
      .slice(0, length);

    return `https://${sanitizedName}-${hash}.${urlConfig.deploy_domain}`;
  }
}
