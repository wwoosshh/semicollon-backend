import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("운영진")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("invite-code")
  get() {
    return this.settings.getInviteCode();
  }

  @Put("invite-code")
  set(@Body() dto: { code: string }) {
    return this.settings.setInviteCode(dto.code);
  }
}
