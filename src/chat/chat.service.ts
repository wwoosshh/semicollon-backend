import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import type { JwtPayload } from "../auth/token.service";

@Injectable()
export class ChatService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async ensureDefaultChannel(spaceId: string) {
    const existing = await this.db
      .selectFrom("chat_channels").select(["id", "name", "space_id", "created_at"])
      .where("space_id", "=", spaceId).orderBy("created_at", "asc").execute();
    if (existing.length) return existing;
    const created = await this.db
      .insertInto("chat_channels").values({ space_id: spaceId, name: "메인" })
      .returning(["id", "name", "space_id", "created_at"]).executeTakeFirstOrThrow();
    return [created];
  }

  listChannels(spaceId: string) {
    return this.db
      .selectFrom("chat_channels").select(["id", "name", "space_id", "created_at"])
      .where("space_id", "=", spaceId).orderBy("created_at", "asc").execute();
  }

  async canAccess(user: JwtPayload, channelId: string): Promise<boolean> {
    const ch = await this.db.selectFrom("chat_channels").select(["space_id"]).where("id", "=", channelId).executeTakeFirst();
    if (!ch) return false;
    if (user.role === "운영진") return true;
    const m = await this.db
      .selectFrom("memberships").select("user_id")
      .where("space_id", "=", ch.space_id).where("user_id", "=", user.sub)
      .executeTakeFirst();
    return !!m;
  }

  async messages(user: JwtPayload, channelId: string, limit = 50) {
    if (!(await this.canAccess(user, channelId))) throw new ForbiddenException("채널 접근 권한이 없습니다.");
    const rows = await this.db
      .selectFrom("messages as m").innerJoin("users as u", "u.id", "m.author_id")
      .select(["m.id", "m.channel_id", "m.author_id", "m.body", "m.created_at", "u.name as author_name"])
      .where("m.channel_id", "=", channelId).orderBy("m.created_at", "desc").limit(limit).execute();
    return rows.reverse();
  }

  async saveMessage(channelId: string, userId: string, body: string) {
    const saved = await this.db
      .insertInto("messages").values({ channel_id: channelId, author_id: userId, body })
      .returning(["id", "created_at"]).executeTakeFirstOrThrow();
    const author = await this.db.selectFrom("users").select("name").where("id", "=", userId).executeTakeFirst();
    return { id: saved.id, channel_id: channelId, author_id: userId, author_name: author?.name ?? "", body, created_at: saved.created_at };
  }
}
