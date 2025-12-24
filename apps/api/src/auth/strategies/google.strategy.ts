import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { GoogleProfile } from '../common/type';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      scope: ['email', 'profile'],
    });
  }

  validate(accessToken: string, refreshToken: string, profile: GoogleProfile, done: VerifyCallback): Promise<void> {
    const { name, emails } = profile;
    const rawPhoto = profile.photos?.[0]?.value;

    const user = {
      email: emails[0].value,
      name: `${name.givenName} ${name.familyName !== 'undefined' ? name.familyName : ''}`.trim(),
      picture: rawPhoto ? rawPhoto.replace("=s96-c", "=s256-c") : null,
      provider: 'google',
    };
    done(null, user);

    return Promise.resolve();
  }
}