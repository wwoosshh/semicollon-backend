import type { Role } from "../auth/roles";
export interface UpdateMemberDto {
  role?: Role;
  cohort?: number | null;
}
