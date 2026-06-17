import { BadRequestException, ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { DB_TOKEN, type Database } from "../db/database";
import { PasswordService } from "./password.service";
import { TokenService } from "./token.service";
import type { SignupDto, LoginDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Database,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
  ) {}

  private issue(user: { id: string; role: "운영진" | "부원" }) {
    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: this.tokens.signAccess(payload),
      refreshToken: this.tokens.signRefresh(payload),
    };
  }

  async signup(dto: SignupDto) {
    const setting = await this.db
      .selectFrom("settings").select("value").where("key", "=", "invite_code").executeTakeFirst();
    const expected = (setting?.value ?? "").trim();
    if (!dto.inviteCode || dto.inviteCode.trim() !== expected) {
      throw new BadRequestException("초대코드가 올바르지 않습니다.");
    }

    const existing = await this.db
      .selectFrom("users").select("id").where("email", "=", dto.email).executeTakeFirst();
    if (existing) throw new ConflictException("이미 가입된 이메일입니다.");

    const cohort = Number.isFinite(Number(dto.cohort)) ? Number(dto.cohort) : null;
    const password_hash = await this.passwords.hash(dto.password);
    const user = await this.db
      .insertInto("users")
      .values({ email: dto.email, password_hash, name: dto.name, cohort })
      .returning(["id", "role"])
      .executeTakeFirstOrThrow();
    return this.issue(user);
  }

  async login(dto: LoginDto) {
    const user = await this.db
      .selectFrom("users")
      .select(["id", "role", "password_hash"])
      .where("email", "=", dto.email)
      .executeTakeFirst();
    if (!user || !(await this.passwords.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
    return this.issue(user);
  }

  refresh(refreshToken: string) {
    const payload = this.tokens.verifyRefresh(refreshToken);
    return this.issue({ id: payload.sub, role: payload.role });
  }

  async me(userId: string) {
    return this.db
      .selectFrom("users")
      .select(["id", "email", "name", "role", "cohort", "avatar_url"])
      .where("id", "=", userId)
      .executeTakeFirstOrThrow();
  }
}
