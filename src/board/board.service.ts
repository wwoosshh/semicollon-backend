import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import type { JwtPayload } from "../auth/token.service";
import type { CreatePostDto, CreateCommentDto } from "./dto";

@Injectable()
export class BoardService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  list(spaceId?: string) {
    let q = this.db
      .selectFrom("posts as p")
      .innerJoin("users as u", "u.id", "p.author_id")
      .leftJoin("comments as c", "c.post_id", "p.id")
      .select((eb) => [
        "p.id", "p.scope", "p.space_id", "p.title", "p.created_at", "u.name as author_name",
        eb.fn.count("c.id").as("comment_count"),
      ])
      .groupBy(["p.id", "u.name"])
      .orderBy("p.created_at", "desc");
    q = spaceId ? q.where("p.space_id", "=", spaceId) : q.where("p.scope", "=", "전체");
    return q.execute();
  }

  async findOne(id: string) {
    const post = await this.db
      .selectFrom("posts as p")
      .innerJoin("users as u", "u.id", "p.author_id")
      .select(["p.id", "p.scope", "p.space_id", "p.title", "p.body", "p.created_at", "p.author_id", "u.name as author_name"])
      .where("p.id", "=", id)
      .executeTakeFirst();
    if (!post) throw new NotFoundException("게시글을 찾을 수 없습니다.");
    const comments = await this.db
      .selectFrom("comments as c")
      .innerJoin("users as u", "u.id", "c.author_id")
      .select(["c.id", "c.body", "c.created_at", "c.author_id", "u.name as author_name"])
      .where("c.post_id", "=", id)
      .orderBy("c.created_at", "asc")
      .execute();
    return { ...post, comments };
  }

  create(user: JwtPayload, dto: CreatePostDto) {
    const scope = (dto.spaceId ? "space" : "전체") as "space" | "전체";
    return this.db
      .insertInto("posts")
      .values({ scope, space_id: dto.spaceId ?? null, author_id: user.sub, title: dto.title, body: dto.body ?? "" })
      .returning(["id"])
      .executeTakeFirstOrThrow();
  }

  addComment(user: JwtPayload, postId: string, dto: CreateCommentDto) {
    return this.db
      .insertInto("comments")
      .values({ post_id: postId, author_id: user.sub, body: dto.body })
      .returning(["id"])
      .executeTakeFirstOrThrow();
  }

  async remove(user: JwtPayload, id: string) {
    const p = await this.db.selectFrom("posts").select(["author_id"]).where("id", "=", id).executeTakeFirst();
    if (!p) return { deleted: false };
    if (p.author_id !== user.sub && user.role !== "운영진") throw new ForbiddenException("삭제 권한이 없습니다.");
    await this.db.deleteFrom("posts").where("id", "=", id).execute();
    return { deleted: true };
  }
}
