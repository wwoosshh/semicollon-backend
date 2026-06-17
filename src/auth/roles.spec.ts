import { isAdmin, canManageMembers } from "./roles";

describe("roles", () => {
  it("isAdmin: 운영진 true, 부원 false, null false", () => {
    expect(isAdmin("운영진")).toBe(true);
    expect(isAdmin("부원")).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
  it("canManageMembers: 운영진만 true", () => {
    expect(canManageMembers("운영진")).toBe(true);
    expect(canManageMembers("부원")).toBe(false);
  });
});
