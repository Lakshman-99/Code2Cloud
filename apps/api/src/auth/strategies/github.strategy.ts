import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-github2";
import { Injectable } from "@nestjs/common";
import { GithubProfile } from "../../common/types/type";
import { VerifyCallback } from "passport-google-oauth20";

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, "github") {
  constructor() {
    super({
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: process.env.GITHUB_CALLBACK_URL!,
      scope: ["read:user", "user:email"],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: GithubProfile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return Promise.resolve(
        done(new Error("No email found from GitHub account")),
      );
    }

    const user = {
      email,
      name: profile.displayName || profile.username,
      picture: profile.photos?.[0]?.value,
      provider: "github",
    };

    done(null, user);
    return Promise.resolve();
  }
}
