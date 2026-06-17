import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AnnouncementsService } from "./announcements.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/token.service";
import type { CreateAnnouncementDto } from "./dto";

@UseGuards(JwtAuthGuard)
@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly svc: AnnouncementsService) {}

  @Get()
  list(@Query("spaceId") spaceId?: string) {
    return this.svc.list(spaceId);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAnnouncementDto) {
    return this.svc.create(user, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.svc.remove(user, id);
  }
}
