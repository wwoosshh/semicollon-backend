import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokenService } from "./token.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const header: string | undefined = req.headers["authorization"];
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException();
    try {
      req.user = this.tokens.verifyAccess(header.slice(7));
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
