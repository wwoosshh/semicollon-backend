import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import type { Role } from "./roles";

export interface JwtPayload {
  sub: string;
  role: Role;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccess(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
      expiresIn: "15m",
    });
  }
  signRefresh(payload: JwtPayload): string {
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
      expiresIn: "30d",
    });
  }
  verifyAccess(token: string): JwtPayload {
    return this.jwt.verify(token, {
      secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
    });
  }
  verifyRefresh(token: string): JwtPayload {
    return this.jwt.verify(token, {
      secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
    });
  }
}
