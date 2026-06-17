import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import type { JwtPayload } from "../auth/token.service";

@Injectable()
export class ChatService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async ensureDefaultChannel(spaceId: string) {
    const any = await this.db.selectFrom("chat_channels").select("id").where("space_id", "=", spaceId).executeTakeFirst();
    if (!any) {
      await this.db.insertInto("chat_channels")
        .values({ space_id: spaceId, name: "메인", category: "일반", type: "text", position: 0 })
        .execute();
    }
  }

  listChannels(spaceId: string) {
    return this.db
      .selectFrom("chat_channels")
      .select(["id", "name", "category", "type", "position", "space_id", "created_at"])
      .where("space_id", "=", spaceId)
      .orderBy("position", "asc")
      .orderBy("created_at", "asc")
      .execute();
  }

  private async assertCanManage(user: JwtPayload, spaceId: string) {
    if (user.role === "운영진") return;
    const m = await this.db.selectFrom("memberships").select("role")
      .where("space_id", "=", spaceId).where("user_id", "=", user.sub).executeTakeFirst();
    if (m?.role !== "리더") throw new ForbiddenException("채널 관리는 리더 또는 운영진만 가능합니다.");
  }

  async createChannel(user: JwtPayload, spaceId: string, dto: { name: string; category?: string; type?: string }) {
    await this.assertCanManage(user, spaceId);
    const max = await this.db.selectFrom("chat_channels")
      .select((eb) => eb.fn.max("position").as("m"))
      .where("space_id", "=", spaceId).executeTakeFirst();
    const position = Number(max?.m ?? 0) + 1;
    return this.db.insertInto("chat_channels")
      .values({ space_id: spaceId, name: dto.name, category: dto.category ?? "일반", type: dto.type ?? "text", position })
      .returning(["id", "name", "category", "type", "position", "space_id", "created_at"])
      .executeTakeFirstOrThrow();
  }

  async updateChannel(user: JwtPayload, channelId: string, dto: { name?: string; category?: string; position?: number }) {
    const ch = await this.db.selectFrom("chat_channels").select(["space_id"]).where("id", "=", channelId).executeTakeFirst();
    if (!ch) throw new NotFoundException("채널을 찾을 수 없습니다.");
    await this.assertCanManage(user, ch.space_id);
    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name;
    if (dto.category !== undefined) patch.category = dto.category;
    if (dto.position !== undefined) patch.position = dto.position;
    if (Object.keys(patch).length) await this.db.updateTable("chat_channels").set(patch).where("id", "=", channelId).execute();
    return this.db.selectFrom("chat_channels")
      .select(["id", "name", "category", "type", "position", "space_id", "created_at"])
      .where("id", "=", channelId).executeTakeFirstOrThrow();
  }

  async deleteChannel(user: JwtPayload, channelId: string) {
    const ch = await this.db.selectFrom("chat_channels").select(["space_id"]).where("id", "=", channelId).executeTakeFirst();
    if (!ch) return { deleted: false };
    await this.assertCanManage(user, ch.space_id);
    await this.db.deleteFrom("chat_channels").where("id", "=", channelId).execute();
    return { deleted: true };
  }

  async canSend(user: JwtPayload, channelId: string): Promise<boolean> {
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
