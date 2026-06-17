import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import type { JwtPayload } from "../auth/token.service";
import type { CreateSpaceDto, UpdateSpaceDto, SpaceStatus, SpaceType } from "./dto";

@Injectable()
export class SpacesService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async create(user: JwtPayload, dto: CreateSpaceDto) {
    const space = await this.db
      .insertInto("spaces")
      .values({ type: dto.type, title: dto.title, description: dto.description ?? "", created_by: user.sub })
      .returning(["id"])
      .executeTakeFirstOrThrow();
    await this.db
      .insertInto("memberships")
      .values({ space_id: space.id, user_id: user.sub, role: "리더" })
      .execute();
    return this.findOne(space.id, user);
  }

  async list(user: JwtPayload, filters: { status?: string; type?: string }) {
    let q = this.db
      .selectFrom("spaces as s")
      .leftJoin("memberships as m", "m.space_id", "s.id")
      .select((eb) => [
        "s.id", "s.type", "s.title", "s.description", "s.status", "s.created_by", "s.created_at",
        eb.fn.count("m.user_id").as("member_count"),
      ])
      .groupBy("s.id")
      .orderBy("s.created_at", "desc");
    if (filters.status) q = q.where("s.status", "=", filters.status as SpaceStatus);
    if (filters.type) q = q.where("s.type", "=", filters.type as SpaceType);
    return q.execute();
  }

  async findOne(id: string, user: JwtPayload) {
    const space = await this.db.selectFrom("spaces").selectAll().where("id", "=", id).executeTakeFirst();
    if (!space) throw new NotFoundException("활동공간을 찾을 수 없습니다.");
    const members = await this.db
      .selectFrom("memberships as m")
      .innerJoin("users as u", "u.id", "m.user_id")
      .select(["m.user_id", "u.name", "m.role", "m.joined_at"])
      .where("m.space_id", "=", id)
      .orderBy("m.joined_at", "asc")
      .execute();
    const mine = members.find((mm) => mm.user_id === user.sub) ?? null;
    return { ...space, members, myRole: mine?.role ?? null };
  }

  private async assertLeaderOrAdmin(id: string, user: JwtPayload) {
    if (user.role === "운영진") return;
    const m = await this.db
      .selectFrom("memberships").select("role")
      .where("space_id", "=", id).where("user_id", "=", user.sub)
      .executeTakeFirst();
    if (m?.role !== "리더") throw new ForbiddenException("권한이 없습니다 (리더 또는 운영진만 가능).");
  }

  async update(id: string, user: JwtPayload, dto: UpdateSpaceDto) {
    await this.assertLeaderOrAdmin(id, user);
    await this.db.updateTable("spaces").set(dto).where("id", "=", id).execute();
    return this.findOne(id, user);
  }

  async join(id: string, user: JwtPayload) {
    const existing = await this.db
      .selectFrom("memberships").select("user_id")
      .where("space_id", "=", id).where("user_id", "=", user.sub)
      .executeTakeFirst();
    if (!existing) {
      await this.db.insertInto("memberships").values({ space_id: id, user_id: user.sub, role: "멤버" }).execute();
    }
    return this.findOne(id, user);
  }

  async leave(id: string, user: JwtPayload) {
    await this.db.deleteFrom("memberships").where("space_id", "=", id).where("user_id", "=", user.sub).execute();
    return { left: true };
  }
}
