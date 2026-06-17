import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import type { JwtPayload } from "../auth/token.service";

@Injectable()
export class FilesService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  private async assertMember(user: JwtPayload, spaceId: string) {
    if (user.role === "운영진") return;
    const m = await this.db
      .selectFrom("memberships").select("user_id")
      .where("space_id", "=", spaceId).where("user_id", "=", user.sub)
      .executeTakeFirst();
    if (!m) throw new ForbiddenException("이 활동공간의 멤버만 접근할 수 있습니다.");
  }

  async saveTree(user: JwtPayload, spaceId: string, paths: string[]) {
    await this.assertMember(user, spaceId);
    const clean = [...new Set((paths ?? []).map((p) => p.trim()).filter((p) => p.length > 0 && p.length <= 1024))].slice(0, 5000);
    if (clean.length) {
      const rows = clean.map((p) => ({
        space_id: spaceId,
        uploaded_by: user.sub,
        name: p.split("/").pop() || p,
        path: p,
      }));
      await this.db
        .insertInto("files")
        .values(rows)
        .onConflict((oc) => oc.columns(["space_id", "path"]).doNothing())
        .execute();
    }
    return this.list(user, spaceId);
  }

  async list(user: JwtPayload, spaceId: string) {
    await this.assertMember(user, spaceId);
    return this.db
      .selectFrom("files")
      .select(["id", "space_id", "name", "path", "created_at"])
      .where("space_id", "=", spaceId)
      .orderBy("path", "asc")
      .execute();
  }

  async remove(user: JwtPayload, fileId: string) {
    const f = await this.db.selectFrom("files").select(["space_id", "uploaded_by"]).where("id", "=", fileId).executeTakeFirst();
    if (!f) return { deleted: false };
    let ok = user.role === "운영진" || f.uploaded_by === user.sub;
    if (!ok) {
      const m = await this.db.selectFrom("memberships").select("role").where("space_id", "=", f.space_id).where("user_id", "=", user.sub).executeTakeFirst();
      ok = m?.role === "리더";
    }
    if (!ok) throw new ForbiddenException("삭제 권한이 없습니다.");
    await this.db.deleteFrom("files").where("id", "=", fileId).execute();
    return { deleted: true };
  }

  async ensureFileChannel(user: JwtPayload, fileId: string) {
    const f = await this.db.selectFrom("files").select(["space_id", "name"]).where("id", "=", fileId).executeTakeFirst();
    if (!f) throw new NotFoundException("파일을 찾을 수 없습니다.");
    await this.assertMember(user, f.space_id);
    const existing = await this.db
      .selectFrom("chat_channels").select(["id", "name", "space_id", "file_id", "created_at"])
      .where("file_id", "=", fileId).executeTakeFirst();
    if (existing) return existing;
    return this.db
      .insertInto("chat_channels")
      .values({ space_id: f.space_id, file_id: fileId, name: f.name })
      .returning(["id", "name", "space_id", "file_id", "created_at"])
      .executeTakeFirstOrThrow();
  }
}
