export type Role = "운영진" | "부원";

export function isAdmin(role: Role | null | undefined): boolean {
  return role === "운영진";
}

export function canManageMembers(role: Role | null | undefined): boolean {
  return isAdmin(role);
}
