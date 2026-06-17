import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { SpacesService } from "./spaces.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/token.service";
import type { CreateSpaceDto, UpdateSpaceDto } from "./dto";

@UseGuards(JwtAuthGuard)
@Controller("spaces")
export class SpacesController {
  constructor(private readonly spaces: SpacesService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateSpaceDto) {
    return this.spaces.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: JwtPayload, @Query("status") status?: string, @Query("type") type?: string) {
    return this.spaces.list(user, { status, type });
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.spaces.findOne(id, user);
  }

  @Patch(":id")
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() dto: UpdateSpaceDto) {
    return this.spaces.update(id, user, dto);
  }

  @Post(":id/join")
  join(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.spaces.join(id, user);
  }

  @Delete(":id/leave")
  leave(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.spaces.leave(id, user);
  }
}
