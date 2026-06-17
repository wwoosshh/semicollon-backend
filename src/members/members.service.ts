import { Inject, Injectable } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import type { UpdateMemberDto } from "./dto";

@Injectable()
export class MembersService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  list() {
    return this.db
      .selectFrom("users")
      .select(["id", "name", "email", "role", "cohort", "avatar_url"])
      .orderBy("cohort", "asc")
      .orderBy("name", "asc")
      .execute();
  }

  async update(id: string, dto: UpdateMemberDto) {
    return this.db
      .updateTable("users")
      .set(dto)
      .where("id", "=", id)
      .returning(["id", "name", "email", "role", "cohort", "avatar_url"])
      .executeTakeFirstOrThrow();
  }
}
