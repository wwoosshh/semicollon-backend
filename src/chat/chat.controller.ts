import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "../auth/token.service";

@UseGuards(JwtAuthGuard)
@Controller()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get("spaces/:id/channels")
  async channels(@Param("id") id: string) {
    await this.chat.ensureDefaultChannel(id);
    return this.chat.listChannels(id);
  }

  @Get("channels/:id/messages")
  messages(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.chat.messages(user, id);
  }
}
