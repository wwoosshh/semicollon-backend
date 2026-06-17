import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import type { JwtPayload } from "../auth/token.service";
import type { CreateEventDto, UpdateEventDto, SetAttendanceDto, AttendanceStatus } from "./dto";

@Injectable()
export class EventsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async list(user: JwtPayload, opts: { spaceId?: string; from?: string; to?: string }) {
    let q = this.db
      .selectFrom("events as e")
      .leftJoin("spaces as s", "s.id", "e.space_id")
      .select(["e.id", "e.scope", "e.space_id", "e.title", "e.starts_at", "e.ends_at", "e.location", "e.kind", "e.created_by", "s.title as space_title"])
      .orderBy("e.starts_at", "asc");
    if (opts.spaceId) {
      q = q.where("e.space_id", "=", opts.spaceId);
    } else {
      q = q.where((eb) =>
        eb.or([
          eb("e.scope", "=", "전체"),
          eb("e.space_id", "in", eb.selectFrom("memberships").select("space_id").where("user_id", "=", user.sub)),
        ]),
      );
    }
    if (opts.from) q = q.where("e.starts_at", ">=", new Date(opts.from));
    if (opts.to) q = q.where("e.starts_at", "<=", new Date(opts.to));
    return q.execute();
  }

  private async assertCanManage(user: JwtPayload, spaceId?: string | null) {
    if (user.role === "운영진") return;
    if (!spaceId) throw new ForbiddenException("전체 일정은 운영진만 관리할 수 있습니다.");
    const m = await this.db
      .selectFrom("memberships").select("role")
      .where("space_id", "=", spaceId).where("user_id", "=", user.sub)
      .executeTakeFirst();
    if (m?.role !== "리더") throw new ForbiddenException("공간 일정은 리더 또는 운영진만 관리할 수 있습니다.");
  }

  async create(user: JwtPayload, dto: CreateEventDto) {
    await this.assertCanManage(user, dto.spaceId);
    const scope = (dto.spaceId ? "space" : "전체") as "space" | "전체";
    return this.db
      .insertInto("events")
      .values({
        scope, space_id: dto.spaceId ?? null, title: dto.title,
        starts_at: new Date(dto.startsAt), ends_at: dto.endsAt ? new Date(dto.endsAt) : null,
        location: dto.location ?? "", kind: dto.kind, created_by: user.sub,
      })
      .returning(["id"])
      .executeTakeFirstOrThrow();
  }

  async findOne(user: JwtPayload, id: string) {
    const event = await this.db
      .selectFrom("events as e").leftJoin("spaces as s", "s.id", "e.space_id")
      .select(["e.id", "e.scope", "e.space_id", "e.title", "e.starts_at", "e.ends_at", "e.location", "e.kind", "e.created_by", "s.title as space_title"])
      .where("e.id", "=", id).executeTakeFirst();
    if (!event) throw new NotFoundException("일정을 찾을 수 없습니다.");
    const attendance = await this.db
      .selectFrom("attendance as a").innerJoin("users as u", "u.id", "a.user_id")
      .select(["a.user_id", "u.name", "a.status", "a.checked_at"])
      .where("a.event_id", "=", id).execute();
    const mine = attendance.find((x) => x.user_id === user.sub) ?? null;
    const counts: Record<AttendanceStatus, number> = { 출석: 0, 지각: 0, 결석: 0 };
    for (const a of attendance) counts[a.status as AttendanceStatus]++;
    let canManage = user.role === "운영진";
    if (!canManage && event.space_id) {
      const m = await this.db.selectFrom("memberships").select("role")
        .where("space_id", "=", event.space_id).where("user_id", "=", user.sub).executeTakeFirst();
      canManage = m?.role === "리더";
    }
    return { ...event, attendance, myStatus: mine?.status ?? null, counts, canManage };
  }

  async update(user: JwtPayload, id: string, dto: UpdateEventDto) {
    const ev = await this.db.selectFrom("events").select(["space_id"]).where("id", "=", id).executeTakeFirst();
    if (!ev) throw new NotFoundException("일정을 찾을 수 없습니다.");
    await this.assertCanManage(user, ev.space_id);
    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.startsAt !== undefined) patch.starts_at = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) patch.ends_at = dto.endsAt ? new Date(dto.endsAt) : null;
    if (dto.location !== undefined) patch.location = dto.location;
    if (dto.kind !== undefined) patch.kind = dto.kind;
    await this.db.updateTable("events").set(patch).where("id", "=", id).execute();
    return this.findOne(user, id);
  }

  async remove(user: JwtPayload, id: string) {
    const ev = await this.db.selectFrom("events").select(["space_id"]).where("id", "=", id).executeTakeFirst();
    if (!ev) return { deleted: false };
    await this.assertCanManage(user, ev.space_id);
    await this.db.deleteFrom("events").where("id", "=", id).execute();
    return { deleted: true };
  }

  async setMyAttendance(user: JwtPayload, eventId: string, dto: SetAttendanceDto) {
    await this.db
      .insertInto("attendance")
      .values({ event_id: eventId, user_id: user.sub, status: dto.status })
      .onConflict((oc) => oc.columns(["event_id", "user_id"]).doUpdateSet({ status: dto.status, checked_at: new Date() }))
      .execute();
    return { ok: true };
  }

  async setMemberAttendance(user: JwtPayload, eventId: string, userId: string, dto: SetAttendanceDto) {
    const ev = await this.db.selectFrom("events").select(["space_id"]).where("id", "=", eventId).executeTakeFirst();
    if (!ev) throw new NotFoundException("일정을 찾을 수 없습니다.");
    await this.assertCanManage(user, ev.space_id);
    await this.db
      .insertInto("attendance")
      .values({ event_id: eventId, user_id: userId, status: dto.status })
      .onConflict((oc) => oc.columns(["event_id", "user_id"]).doUpdateSet({ status: dto.status, checked_at: new Date() }))
      .execute();
    return { ok: true };
  }
}
