import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { EventsService } from "./events.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/token.service";
import type { CreateEventDto, UpdateEventDto, SetAttendanceDto } from "./dto";

@UseGuards(JwtAuthGuard)
@Controller("events")
export class EventsController {
  constructor(private readonly svc: EventsService) {}

  @Get()
  list(@CurrentUser() u: JwtPayload, @Query("spaceId") spaceId?: string, @Query("from") from?: string, @Query("to") to?: string) {
    return this.svc.list(u, { spaceId, from, to });
  }

  @Get(":id")
  findOne(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.findOne(u, id);
  }

  @Post()
  create(@CurrentUser() u: JwtPayload, @Body() dto: CreateEventDto) {
    return this.svc.create(u, dto);
  }

  @Patch(":id")
  update(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() dto: UpdateEventDto) {
    return this.svc.update(u, id, dto);
  }

  @Delete(":id")
  remove(@CurrentUser() u: JwtPayload, @Param("id") id: string) {
    return this.svc.remove(u, id);
  }

  @Put(":id/attendance")
  setMine(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Body() dto: SetAttendanceDto) {
    return this.svc.setMyAttendance(u, id, dto);
  }

  @Put(":id/attendance/:userId")
  setMember(@CurrentUser() u: JwtPayload, @Param("id") id: string, @Param("userId") userId: string, @Body() dto: SetAttendanceDto) {
    return this.svc.setMemberAttendance(u, id, userId, dto);
  }
}
