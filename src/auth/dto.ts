export interface SignupDto {
  email: string;
  password: string;
  name: string;
  cohort: number;
  inviteCode: string;
}
export interface LoginDto {
  email: string;
  password: string;
}
export interface RefreshDto {
  refreshToken: string;
}
