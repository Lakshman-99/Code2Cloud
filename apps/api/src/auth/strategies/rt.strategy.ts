import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { ForbiddenException, Injectable } from "@nestjs/common";
import { JwtPayload, JwtPayloadWithRt } from "../common/type";

@Injectable()
export class RtStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET!, // Ensure this ENV is set
      passReqToCallback: true, // <--- Critical: lets us get the raw token
    });
  }

  validate(req: Request, payload: JwtPayload): JwtPayloadWithRt {
    const authHeader = req.get("authorization");
    
    if (!authHeader) throw new ForbiddenException("Refresh token malformed");
    
    const refreshToken = authHeader.replace("Bearer", "").trim();
    
    return {
      ...payload,
      refreshToken,
    };
  }
}
