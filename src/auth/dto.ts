export interface SignupDto {
  email: string;
  password: string;
  name: string;
}
export interface LoginDto {
  email: string;
  password: string;
}
export interface RefreshDto {
  refreshToken: string;
}
