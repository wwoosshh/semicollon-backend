import { ConflictException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
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
    const existing = await this.db
      .selectFrom("users").select("id").where("email", "=", dto.email).executeTakeFirst();
    if (existing) throw new ConflictException("이미 가입된 이메일입니다.");

    const password_hash = await this.passwords.hash(dto.password);
    const user = await this.db
      .insertInto("users")
      .values({ email: dto.email, password_hash, name: dto.name })
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
