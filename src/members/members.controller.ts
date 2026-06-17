import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { MembersService } from "./members.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import type { UpdateMemberDto } from "./dto";

@UseGuards(JwtAuthGuard)
@Controller("members")
export class MembersController {
  constructor(private readonly members: MembersService) {}

  @Get()
  list() {
    return this.members.list();
  }

  @UseGuards(RolesGuard)
  @Roles("운영진")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateMemberDto) {
    return this.members.update(id, dto);
  }
}
