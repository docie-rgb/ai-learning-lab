# AIFFEL Campus Agent Code Review Templete
- 개발자 : 변경진
- 리뷰어 : 최승현

> 리뷰 대상: [`assignments/todo-app`](https://github.com/docie-rgb/ai-learning-lab/tree/main/assignments/todo-app) (원본 `zslayer-dev/ai-learning-lab` 포크)
> 구성: JavaScript(Node.js + Express 5) 백엔드 + HTML/CSS/JS 화면, 저장소 SQLite(길 A) ↔ Supabase(길 B), Render 배포
> 리뷰 방법: 코드·문서·스크린샷·Git 이력 정적 검토, 화면공유로 시연 영상과 배포 화면 확인


# ART(Agent Review Template)
[x]  **1. 원하는 기능이 의도한 대로 동작하나요?**
- 요청(프롬프트)한 기능이 정상적으로 구현되었는지?
- 실제 실행 화면/결과물을 캡처하여 근거로 첨부

PRD의 기능이 모두 구현되었고, 완료 기준마다 증빙이 1:1로 연결되어 있다.

| PRD 요구사항 | 구현 위치 | 근거 |
|---|---|---|
| 할 일 추가·목록·완료·삭제 (CRUD) | `server.js` `/api/todos`, `db/sqlite.js`, `db/supabase.js` | [A1-추가](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/screenshots/A1-추가.jpg), [A2-완료-삭제](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/screenshots/A2-완료-삭제.jpg) |
| 서버를 껐다 켜도 데이터 유지 (로컬) | `todo.db` 파일 저장 | [A3-서버재시작후-유지](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/screenshots/A3-서버재시작후-유지.jpg), NOTES 의 `SELECT * FROM todos` 결과 |
| 마감일 강조 / '오늘' 필터 | `public/app.js` `render()`, `GET /api/todos?date=` | [A4-오늘필터](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/screenshots/A4-오늘필터.jpg) |
| Supabase 전환 + 로그인 | `auth.js`, `db/supabase.js` | [B1-로그인화면](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/screenshots/B1-로그인화면.jpg), [B4-Supabase-TableEditor](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/screenshots/B4-Supabase-TableEditor.png) |
| 다른 계정의 할 일 차단 (RLS) | `supabase/schema.sql`, `scripts/rls-check.mjs` | [rls-check-result.txt](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/rls-check-result.txt) 11/11 통과 |
| Render 배포 | NOTES 배포 준비물 표 | [C2-배포-계정A-B의할일안보임](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/screenshots/C2-배포-계정A-B의할일안보임.png), [rls-check-result-render.txt](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/rls-check-result-render.txt) 11/11 통과 |
| 3분 시연 | — | [docs/demo.mp4](https://github.com/docie-rgb/ai-learning-lab/blob/main/assignments/todo-app/docs/demo.mp4) |

- 좋았던 점: 입력값 검사(빈 제목, 없는 날짜 `2026-02-30`, 잘못된 완료 값, SQL 주입 문자열)를 API 로 직접 호출한 결과까지 표로 남겨, "화면에서 잘 된다"를 넘어 백엔드 동작을 증명했다.
- 아쉬운 점: `B2-Supabase-추가-완료-삭제.png` 와 `B3-서버재시작후-유지.png` 가 **같은 파일(해시 동일)** 이다. Supabase 모드의 "서버 재시작 후 유지"는 스크린샷만으로는 확인되지 않고 시연 영상에 의존한다.
- 리뷰어 환경에 Node.js 가 없어 로컬 실행은 하지 않았고, 시연 영상·배포 화면·제출된 스크린샷을 근거로 판단했다.


[x]  **2. 보안 검토를 수행했나요?**
- API 키, 비밀번호 등 민감 정보가 코드에 하드코딩되지 않았는지
- 사용자 입력값 검증 등 기본 보안 사항 확인
- 외부 데이터/의존성 사용 시 출처와 위험 검토했는지

**리뷰어가 직접 확인한 것**: 저장소 전체 Git 이력에서 Supabase 키(`sb_publishable_`/`sb_secret_`), JWT(`eyJ…`), OpenAI·GitHub·AWS 형식 키, 테스트 계정 비밀번호 패턴을 검색 → **0건**. `.env`·`todo.db` 가 커밋된 적 없음. `public/` 에 `innerHTML`·`eval` 사용 0건.

### 보안 장점

| 영역 | 내용 | 코드 위치 |
|---|---|---|
| 비밀값 관리 | 키는 `.env` / Render 환경변수에만 두고 코드는 이름으로만 읽는다. `.env.example` 은 빈 값, `.gitignore` 에 `.env`·`todo.db` 등록 | `.env.example`, `.gitignore`, `db/supabase.js` 6~9행 |
| 최소 권한 키 | RLS 를 우회하는 secret/service_role 키를 쓰지 않고 publishable 키만 사용 | `.env.example` 주석, NOTES |
| RLS 를 실제 방어선으로 사용 | 요청마다 **로그인 사용자의 토큰**으로 Supabase 를 호출해 DB 가 `auth.uid()` 기준으로 걸러낸다. 백엔드 코드에서 `user_id` 로 필터링하지 않아도 남의 행이 안 보인다 | `db/supabase.js` `dbFor()` |
| RLS 정책 설계 | SELECT/INSERT/UPDATE/DELETE 정책 4개, UPDATE 는 USING + WITH CHECK 둘 다 지정(소유권 바꾸기 차단), `anon` 권한 `revoke` 로 비로그인 이중 차단 | `supabase/schema.sql` |
| RLS 검증 방식 | 백엔드 API 경유 + **DB 직접 요청** 두 경로로, 로컬과 Render 배포 서버 모두에서 11건 확인. "백엔드에 실수가 있어도 DB 가 막는다"를 증명 | `scripts/rls-check.mjs`, `docs/rls-check-result*.txt` |
| 토큰 보관 | 로그인 토큰을 httpOnly 쿠키에 저장 → 화면 JS(XSS)로 탈취 불가. `SameSite=Lax`, `trust proxy` 로 배포 시 `Secure` 적용 | `auth.js` `cookieOptions()`, `server.js` 15행 |
| 토큰 검증 | 쿠키 토큰을 Supabase `getUser()` 로 매 요청 검증, 만료 시 refresh 토큰으로 재발급 | `auth.js` `currentUser()` |
| 입력값 검증 | 백엔드에서 제목(공백·200자), 날짜(형식 + 실제 존재하는 날짜), 완료 값(boolean), id(양의 정수), 이메일 형식·비밀번호 길이 검사. DB 에도 CHECK 제약 | `server.js` 31~95행, `auth.js` `readCredentials()`, `schema.sql` |
| SQL 주입 방어 | SQLite 는 `?` 파라미터화 쿼리, Supabase 는 SDK 쿼리 빌더 사용. 주입 문자열 테스트 결과도 기록 | `db/sqlite.js`, NOTES |
| XSS 방어 | 사용자 입력을 `textContent` 로만 출력 | `public/app.js` 62행 |
| 정보 노출 최소화 | 예상 못 한 오류는 내부 내용을 숨기고 일반 메시지만 응답, 로그인 실패 사유를 하나로 통일(계정 존재 여부 비공개) | `server.js` 98~102행, `auth.js` 104행 |
| CSRF | `SameSite=Lax` + 서버가 JSON 본문만 해석(`express.json()`) → 다른 사이트의 폼 전송은 본문이 비어 400 으로 끝나므로 실질적으로 차단됨 | `server.js` 16행 |
| 의존성 | `express`, `cookie-parser`, `@supabase/supabase-js` 3개뿐인 공식 패키지, `package-lock.json` 으로 버전 고정, SQLite 는 Node 내장 `node:sqlite` 사용 | `package.json` |

### 보안 단점 / 위험

| 위험도 | 내용 | 영향 | 위치 |
|---|---|---|---|
| 중간 | 로그아웃이 쿠키만 지우고 **Supabase 세션은 종료하지 않는다** | refresh 토큰이 유출되면 로그아웃 후에도 최대 30일간 새 토큰을 발급받을 수 있다 | `auth.js` 110~113행 |
| 중간 | 로그인·회원가입에 **요청 횟수 제한이 없다**. 배포 앱이 공개 회원가입을 허용한다 | 비밀번호 대입 시도, 가입 스팸. 모든 요청이 Render 서버 IP 하나로 Supabase 에 가므로, 한 사람이 Supabase 의 IP 기준 제한을 소진하면 **다른 사용자 전원의 로그인이 막힐 수 있다** | `auth.js` `/signup`, `/login` |
| 낮음 | refresh 토큰 쿠키의 `path` 가 `/` 라서 정적 파일 요청에도 함께 전송된다 | 노출 범위가 필요 이상으로 넓다 | `auth.js` `cookieOptions()` |
| 낮음 | 보안 헤더(CSP, X-Frame-Options, X-Content-Type-Options 등) 미설정, `X-Powered-By: Express` 기본 노출 | 클릭재킹·MIME 스니핑 방어 부재, 서버 종류 노출 | `server.js` |
| 낮음 | 등록 버튼이 요청 중에도 활성 상태 | 응답이 느릴 때 같은 할 일이 중복 등록될 수 있다 | `public/app.js` 115~129행 |
| 참고 | RLS 결과 파일에 로컬 작업 경로(`C:\Claude\…`)가 포함 | 개인 식별 정보는 아니지만 공개할 필요가 없는 정보 | `docs/rls-check-result*.txt` |

- 의존성 출처·위험 검토 기록(왜 이 패키지를 골랐는지, `npm audit` 결과 등)은 문서에 없다. 패키지 수가 적어 위험은 낮지만 한 줄이라도 남기면 좋다.


[ ]  **3. 에러가 난 부분을 디버깅하여 "문제를 해결한 기록"을 남겼나요?**
- 에이전트가 만든 코드의 오류를 어떻게 발견하고 수정했는지
- 새로운 시도 및 추가 실험이 기록되어 있는지

**부분 충족.**

- 있음: 입력값 검사·SQL 주입·RLS 를 일부러 실패하게 만드는 **추가 실험**을 하고 결과를 표로 남겼다. RLS 를 DB 직접 요청으로까지 검증한 것은 새로운 시도로 평가할 만하다.
- 없음: NOTES 에는 모든 항목이 "통과"로만 기록되어 있고, **"오류 발생 → 원인 분석 → 수정"의 흔적이 없다.** Git 이력도 todo-app 관련 커밋이 3개이며 첫 커밋 하나에 앱 전체가 들어 있어 개발·수정 과정을 따라갈 수 없다.
- 에이전트에게 준 프롬프트(요청 내용)와 에이전트가 만든 코드를 어떻게 검토했는지의 기록도 PRD 외에는 없다.


# 참고 링크 및 코드 개선

## 1.리뷰 시 참고한 링크가 있다면 링크와 간략한 설명을 첨부합니다.

- [Supabase – Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): 정책의 USING / WITH CHECK, `(select auth.uid())` 패턴 확인
- [Supabase – API Keys](https://supabase.com/docs/guides/api/api-keys): publishable 키와 secret 키의 차이(secret 키는 RLS 우회)
- [Supabase – signOut](https://supabase.com/docs/reference/javascript/auth-signout): 로그아웃 시 세션(refresh 토큰) 무효화 방법
- [Express – behind proxies](https://expressjs.com/en/guide/behind-proxies.html): `trust proxy` 설정과 `req.secure` 동작
- [express-rate-limit](https://github.com/express-rate-limit/express-rate-limit): 로그인·회원가입 요청 횟수 제한
- [Helmet](https://helmetjs.github.io/): Express 보안 헤더 일괄 적용
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html): SameSite 쿠키와 추가 방어(Origin 검사)
- [GitHub – 커밋 이메일 주소 설정](https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-personal-account-on-github/managing-email-preferences/setting-your-commit-email-address): noreply 이메일로 개인 이메일 비공개

## 2.리뷰를 통해 개선을 제안할 부분이 있다면 내용과 간략한 설명을 첨부합니다.

1. **로그아웃 시 Supabase 세션 종료**: 쿠키 삭제 전에 사용자의 토큰으로 Supabase 로그아웃(세션 종료) API 를 호출해 refresh 토큰을 무효화한다.
2. **로그인·회원가입 요청 제한**: `express-rate-limit` 으로 `/api/auth/login`, `/api/auth/signup` 에 IP 당 횟수 제한을 건다. 과제용 배포라면 Supabase 대시보드에서 공개 회원가입을 끄는 것도 방법이다.
3. **쿠키 범위 축소**: refresh 쿠키의 `path` 를 `/api/auth` 로 좁히고, 갱신은 해당 경로에서만 처리한다.
4. **보안 헤더**: `helmet()` 적용, `app.disable('x-powered-by')`.
5. **디버깅 기록 추가**: NOTES 에 "문제 해결 기록" 섹션을 만들어 `증상 → 원인 → 해결 → 확인` 형식으로 남긴다 (예: 배포에서 로그인 쿠키가 Secure 로 설정되지 않아 `trust proxy` 를 추가한 과정). 기능 단위로 나누어 커밋하면 수정 이력이 자연스럽게 남는다.
6. **Supabase 재시작 증빙 교체**: B3 를 실제 재시작 후 화면으로 다시 캡처한다(B2 와 동일 파일).
7. **중복 등록 방지**: 요청 중에는 등록 버튼을 `disabled` 로 바꾼다.
8. (선택) **자동 테스트**: 현재 RLS 확인 스크립트는 훌륭하지만, 입력값 검증 API 를 `node --test` 로 자동화하면 수정 후 회귀를 바로 잡을 수 있다.


# 총평

요구사항(PRD) → 구현 → 검증 → 배포의 흐름이 매우 깔끔한 결과물이다. 특히 보안 면에서 **"백엔드를 믿지 않고 DB(RLS)를 최종 방어선으로 둔다"** 는 설계를 정확히 구현했고, 이를 백엔드 경유와 DB 직접 요청 두 경로, 로컬과 배포 서버 두 환경에서 검증해 증명한 점이 가장 인상적이었다. 비밀값 관리(하드코딩 0건, publishable 키만 사용), httpOnly 쿠키, 입력값 검증, 파라미터화 쿼리 등 기본기도 빠짐없이 갖췄다.

다만 공개 저장소의 스크린샷과 커밋 정보에 **개인 이메일이 노출**되어 있어 가장 먼저 정리할 것을 권한다. 또한 로그아웃 시 세션 미종료와 로그인 요청 제한 부재는 배포 서비스로서 보완할 부분이다. ART 3 의 디버깅 기록은 "통과" 결과 위주라, 에이전트가 만든 코드에서 무엇이 잘못되었고 어떻게 고쳤는지를 남기면 학습 기록으로서의 가치가 더 커질 것이다.
