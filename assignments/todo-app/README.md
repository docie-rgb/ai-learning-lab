# 내 Todo 앱

새로고침하고 서버를 껐다 켜도 할 일이 남는 Todo 앱입니다.

- [PRD.md](PRD.md) - 만들 기능과 조건
- [docs/DB_DESIGN.md](docs/DB_DESIGN.md) - DB 구조도
- [NOTES.md](NOTES.md) - 확인 기록과 스크린샷

## 실행 방법 (로컬)
Node.js 22.13 이상이 필요합니다.

```bash
npm install
cp .env.example .env
npm start
```

브라우저에서 http://localhost:3000 을 엽니다. 데이터는 `todo.db` 파일에 저장됩니다.

## Supabase로 실행 (길 B)
1. Supabase SQL Editor에서 [supabase/schema.sql](supabase/schema.sql) 실행
2. `.env`에 `DB_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_KEY`(publishable 키) 입력
3. `npm start` → 화면에서 회원가입 / 로그인
4. RLS 확인: `.env`에 테스트 계정 2개를 적고 `npm run rls-check`

## 구조
```
public/            화면 (HTML/CSS/JS) - 백엔드 API에만 요청
server.js          백엔드 - 요청 검사, API(/api/todos)
auth.js            로그인 (Supabase Auth, httpOnly 쿠키)
db/sqlite.js       DB 접근 - 로컬 SQLite
db/supabase.js     DB 접근 - Supabase (로그인한 사용자 토큰으로 → RLS 적용)
supabase/schema.sql  표 + RLS 정책
scripts/rls-check.mjs  두 계정으로 RLS 확인
```
