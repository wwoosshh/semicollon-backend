import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "./token.service";

export const CurrentUser = createParamDecorator(
  (_data, ctx: ExecutionContext): JwtPayload =>
    ctx.switchToHttp().getRequest().user,
);
