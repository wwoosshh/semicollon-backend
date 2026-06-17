import { Inject, Injectable } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";

@Injectable()
export class SettingsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Database) {}

  async getInviteCode() {
    const s = await this.db.selectFrom("settings").select("value").where("key", "=", "invite_code").executeTakeFirst();
    return { code: s?.value ?? "" };
  }

  async setInviteCode(code: string) {
    await this.db
      .insertInto("settings")
      .values({ key: "invite_code", value: code })
      .onConflict((oc) => oc.column("key").doUpdateSet({ value: code }))
      .execute();
    return { code };
  }
}
