import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { VoiceService } from "./voice.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/token.service";

@UseGuards(JwtAuthGuard)
@Controller()
export class VoiceController {
  constructor(private readonly voice: VoiceService) {}

  @Post("channels/:id/voice-token")
  token(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.voice.token(user, id);
  }
}
