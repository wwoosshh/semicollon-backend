import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import type { JwtPayload } from "../auth/token.service";
import type { CreateAnnouncementDto } from "./dto";

@Injectable()
export class AnnouncementsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  list(spaceId?: string) {
    let q = this.db
      .selectFrom("announcements as a")
      .innerJoin("users as u", "u.id", "a.author_id")
      .select(["a.id", "a.scope", "a.space_id", "a.title", "a.body", "a.created_at", "u.name as author_name"])
      .orderBy("a.created_at", "desc");
    q = spaceId ? q.where("a.space_id", "=", spaceId) : q.where("a.scope", "=", "전체");
    return q.execute();
  }

  private async assertCanPost(user: JwtPayload, spaceId?: string | null) {
    if (user.role === "운영진") return;
    if (!spaceId) throw new ForbiddenException("전체 공지는 운영진만 작성할 수 있습니다.");
    const m = await this.db
      .selectFrom("memberships").select("role")
      .where("space_id", "=", spaceId).where("user_id", "=", user.sub)
      .executeTakeFirst();
    if (m?.role !== "리더") throw new ForbiddenException("공간 공지는 리더 또는 운영진만 작성할 수 있습니다.");
  }

  async create(user: JwtPayload, dto: CreateAnnouncementDto) {
    await this.assertCanPost(user, dto.spaceId);
    const scope = (dto.spaceId ? "space" : "전체") as "space" | "전체";
    return this.db
      .insertInto("announcements")
      .values({ scope, space_id: dto.spaceId ?? null, author_id: user.sub, title: dto.title, body: dto.body ?? "" })
      .returning(["id"])
      .executeTakeFirstOrThrow();
  }

  async remove(user: JwtPayload, id: string) {
    const a = await this.db.selectFrom("announcements").select(["author_id"]).where("id", "=", id).executeTakeFirst();
    if (!a) return { deleted: false };
    if (a.author_id !== user.sub && user.role !== "운영진") throw new ForbiddenException("삭제 권한이 없습니다.");
    await this.db.deleteFrom("announcements").where("id", "=", id).execute();
    return { deleted: true };
  }
}
