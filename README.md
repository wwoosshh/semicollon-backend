# semicolon-backend

세미콜론 동아리 통합 플랫폼 — **백엔드 API 서버**

## 스택
- NestJS (TypeScript)
- 자체 JWT 인증 (access + refresh, bcrypt)
- Socket.IO 게이트웨이 (실시간 채팅 · presence)
- Kysely (타입 안전 SQL 쿼리, `semicolon-db` 스키마 기반 타입 생성)
- LiveKit Server SDK (음성 방 토큰 발급)
- Cloudflare R2 (파일/자료실 스토리지, presigned URL)

## 배포
- Railway

## 연동
- DB: `semicolon-db` (Railway Postgres)
- 프론트: `semicolon-frontend` (Vercel)
- 음성: LiveKit Cloud (토큰 발급은 이 서버가 담당)
