import { JwtService } from "@nestjs/jwt";
import { TokenService } from "./token.service";

describe("TokenService", () => {
  const svc = new TokenService(new JwtService(), {
    getOrThrow: (k: string) => (k === "JWT_ACCESS_SECRET" ? "a-secret" : "r-secret"),
  } as any);

  it("access 토큰을 발급하고 검증한다", () => {
    const token = svc.signAccess({ sub: "u1", role: "부원" });
    const payload = svc.verifyAccess(token);
    expect(payload.sub).toBe("u1");
    expect(payload.role).toBe("부원");
  });

  it("잘못된 시크릿의 토큰은 access 검증 실패", () => {
    const token = svc.signRefresh({ sub: "u1", role: "부원" });
    expect(() => svc.verifyAccess(token)).toThrow();
  });
});
