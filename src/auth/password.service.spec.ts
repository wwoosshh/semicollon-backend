import { PasswordService } from "./password.service";

describe("PasswordService", () => {
  const svc = new PasswordService();
  it("해시는 평문과 다르다", async () => {
    const hash = await svc.hash("secret123");
    expect(hash).not.toBe("secret123");
    expect(hash.length).toBeGreaterThan(20);
  });
  it("같은 평문은 compare 시 true", async () => {
    const hash = await svc.hash("secret123");
    expect(await svc.compare("secret123", hash)).toBe(true);
  });
  it("다른 평문은 compare 시 false", async () => {
    const hash = await svc.hash("secret123");
    expect(await svc.compare("wrong", hash)).toBe(false);
  });
});
