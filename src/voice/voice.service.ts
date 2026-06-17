import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AccessToken } from "livekit-server-sdk";
import { DB_TOKEN, type Database } from "../db/database";
import type { JwtPayload } from "../auth/token.service";

@Injectable()
export class VoiceService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly config: ConfigService,
  ) {}

  private async assertMember(user: JwtPayload, spaceId: string) {
    if (user.role === "운영진") return;
    const m = await this.db
      .selectFrom("memberships").select("user_id")
      .where("space_id", "=", spaceId).where("user_id", "=", user.sub)
      .executeTakeFirst();
    if (!m) throw new ForbiddenException("멤버만 음성 채널에 참여할 수 있습니다.");
  }

  async token(user: JwtPayload, channelId: string) {
    const ch = await this.db
      .selectFrom("chat_channels").select(["id", "space_id", "type", "name"])
      .where("id", "=", channelId).executeTakeFirst();
    if (!ch) throw new NotFoundException("채널을 찾을 수 없습니다.");
    if (ch.type !== "voice") throw new ForbiddenException("음성 채널이 아닙니다.");
    await this.assertMember(user, ch.space_id);

    const u = await this.db.selectFrom("users").select(["name"]).where("id", "=", user.sub).executeTakeFirst();
    const at = new AccessToken(
      this.config.getOrThrow<string>("LIVEKIT_API_KEY"),
      this.config.getOrThrow<string>("LIVEKIT_API_SECRET"),
      { identity: user.sub, name: u?.name ?? "" },
    );
    at.addGrant({ roomJoin: true, room: channelId, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    return { token, url: this.config.getOrThrow<string>("LIVEKIT_URL") };
  }
}
