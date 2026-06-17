import { Controller, Get, Inject } from "@nestjs/common";
import { sql } from "kysely";
import { DB_TOKEN, type Database } from "../db/database";

@Controller("health")
export class HealthController {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  @Get()
  check() {
    return { status: "ok" };
  }

  @Get("db")
  async checkDb() {
    try {
      await sql`select 1`.execute(this.db);
      return { db: "ok" };
    } catch (e) {
      return { db: "down", error: (e as Error).message };
    }
  }
}
