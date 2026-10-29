# 확인 기록

**시연 영상 (3분 3초):** [docs/demo.mp4](docs/demo.mp4)
로컬 SQLite에서 추가·완료·삭제 → 서버 재시작 후 유지 → todo.db 조회, Supabase에서 같은 확인 → Table Editor → RLS 확인, Render 배포 서버에서 확인 순서로 담았다. (2026-10-29 촬영, 브라우저 화면 캡처에 자막을 붙여 제작)

## 길 A - 로컬 SQLite (2026-10-29)

**구성:** Express 백엔드(`server.js`) + Node 내장 SQLite(`db/sqlite.js`) → `todo.db` 파일 하나에 저장.
화면(`public/`)은 `/api/todos`에만 요청하고, DB 접근 코드는 백엔드에만 있다.

| 확인 항목 | 결과 | 증빙 |
|---|---|---|
| 할 일 추가 → 목록에 표시 | 통과 | [A1-추가](docs/screenshots/A1-추가.jpg) |
| 완료 표시(취소선) / 삭제 | 통과 | [A2-완료-삭제](docs/screenshots/A2-완료-삭제.jpg) |
| 서버 프로세스 종료 → 재시작 → 새로고침 후에도 남음 | 통과 | [A3-서버재시작후-유지](docs/screenshots/A3-서버재시작후-유지.jpg) |
| 마감일 지난 할 일 빨간색 강조 | 통과 | A1~A3의 'DB 구조도 그리기' |
| '오늘' 필터 | 통과 | [A4-오늘필터](docs/screenshots/A4-오늘필터.jpg) |
| `todo.db`의 `todos` 표에 행이 실제로 저장됨 | 통과 | 아래 조회 결과 |
| `.env`, `todo.db`가 Git에 올라가지 않음 | 통과 | `git status`에 나타나지 않음 |

**DB 직접 조회 (`SELECT * FROM todos`, 서버 재시작 후)**

| id | title | done | due_date | created_at |
|---|---|---|---|---|
| 7 | 과제 PRD 쓰기 | 1 | 2026-10-29 | 2026-10-29 07:50:08 |
| 8 | DB 구조도 그리기 | 0 | 2026-10-27 | 2026-10-29 07:50:09 |
| 9 | Supabase 가입하기 | 0 | 2026-11-01 | 2026-10-29 07:50:09 |
| 10 | 장보기 | 0 | (없음) | 2026-10-29 07:50:10 |

**백엔드 입력 검사 (API 직접 호출)**

| 요청 | 응답 |
|---|---|
| 제목이 공백뿐 | 400 "할 일 제목을 입력하세요." |
| 마감일 `2026-02-30` (없는 날짜) | 400 "마감일은 YYYY-MM-DD 형식이어야 합니다." |
| 완료 값 `"yes"` | 400 "done 값은 true 또는 false여야 합니다." |
| 없는 id 삭제 | 404 "할 일을 찾을 수 없습니다." |
| 제목 `'); DROP TABLE todos;--` | 201, 글자 그대로 저장되고 표는 무사함 (파라미터화 쿼리) |

## 길 B - Supabase (2026-10-29)

**클라우드 전환 기록 (한 줄):** `.env`의 `DB_PROVIDER=supabase`로 저장소를 로컬 SQLite에서 Supabase Postgres(서울 리전)로 바꾸고, Supabase Auth 로그인과 사용자별 `user_id`를 추가했다. 화면은 그대로 백엔드 API에만 요청하고, Supabase는 백엔드(`db/supabase.js`)만 부른다.

**RLS 확인 기록 (한 줄):** `todos`에 RLS를 켜고 "`auth.uid() = user_id`인 행만" 조회·추가·수정·삭제 정책 4개를 걸었고, 테스트 계정 두 개로 백엔드 경유·DB 직접 요청 모두에서 남의 할 일 접근이 막히는 것을 11건 확인했다.

**구성**
- 표와 정책: [supabase/schema.sql](supabase/schema.sql)
- 로그인 토큰은 httpOnly 쿠키에 저장 (화면 JS가 읽을 수 없음)
- 백엔드는 요청마다 **로그인한 사용자의 토큰**으로 Supabase를 호출 → RLS가 그 사용자 기준으로 적용됨
- RLS를 무시하는 secret / service_role 키는 쓰지 않고 publishable 키만 사용

**DB 접근 코드는 왜 서버에 있나?** Supabase를 부르는 코드는 `db/supabase.js`와 `auth.js`에만 있고 둘 다 Node 서버에서 실행된다. 화면 코드(`public/`)는 누구나 브라우저에서 열어 볼 수 있어서, 여기에 DB 주소나 키를 두면 다른 사람이 백엔드의 입력 검사를 건너뛰고 DB에 직접 요청할 수 있기 때문이다.

| 확인 항목 | 결과 | 증빙 |
|---|---|---|
| 로그인 화면 (로그인 전에는 할 일 API가 401) | 통과 | [B1-로그인화면](docs/screenshots/B1-로그인화면.jpg) |
| 회원가입 → 할 일 추가 / 완료 / 삭제 | 통과 | [B2-Supabase-추가-완료-삭제](docs/screenshots/B2-Supabase-추가-완료-삭제.png) |
| 서버 종료 → 재시작 → 새로고침 후에도 남음 (로그인도 유지) | 통과 | [B3-서버재시작후-유지](docs/screenshots/B3-서버재시작후-유지.png) |
| Supabase Table Editor의 `todos` 표에 행이 쌓임, RLS 정책 4개 | 통과 | [B4-Supabase-TableEditor](docs/screenshots/B4-Supabase-TableEditor.png) |
| 다른 계정의 할 일 조회·수정·삭제 거절 (RLS) | 11건 모두 통과 | [rls-check-result.txt](docs/rls-check-result.txt) |

**RLS 확인 상세 (`npm run rls-check`)** - 계정 A가 할 일을 만들고, 계정 B가 그 할 일에 손대려고 시도한다.

| 시도 | 결과 |
|---|---|
| [API] B의 목록에 A의 할 일이 보이나 | 안 보임 (B는 자기 것 3개만 받음) |
| [API] B가 A의 할 일 완료 처리 / 삭제 | 404 거절 |
| [API] 로그인 없이 목록 요청 | 401 거절 |
| [DB 직접] 로그인 없이 `todos` 조회 | 42501 permission denied |
| [DB 직접] B 토큰으로 A의 행 조회 / 수정 / 삭제 | 0행 (RLS가 걸러냄) |
| [DB 직접] B가 `user_id`를 A로 넣어 추가 | 42501 거절 |
| A의 할 일 상태 | 제목·완료 여부 그대로 |

백엔드를 건너뛰고 Supabase에 직접 요청해도 막힌다는 것은, 백엔드 코드에 실수가 있더라도 DB(RLS)가 마지막으로 지켜 준다는 뜻이다.

## 배포 - Render (2026-10-29)

**접속 URL:** https://todo-app-3pg4.onrender.com
(Free 요금제라 15분간 접속이 없으면 서버가 잠들고, 다음 첫 접속에 30초~1분 걸릴 수 있음)

**배포 준비물**

| 준비물 | 이 앱에서 쓴 값 |
|---|---|
| 코드 보관 위치 | GitHub `zslayer-dev/ai-learning-lab`, 브랜치 `main` |
| Root Directory | `assignments/todo-app` (저장소 안의 하위 폴더) |
| 런타임 | Node (`package.json`의 `engines`: 22.13 이상) |
| 빌드 명령 | `npm ci` |
| 시작 명령 | `npm start` |
| 환경변수 | `DB_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_KEY`(publishable) - Render 대시보드에만 입력, 코드·Git에는 없음 |
| 넣지 않은 것 | `PORT`(Render가 지정), secret / service_role 키, 테스트 계정 정보 |
| 요금제 / 지역 | Free / Singapore (Supabase 서울과 가장 가까운 곳) |
| 코드에서 준비한 것 | `app.set('trust proxy', 1)` - Render 프록시 뒤에서 https를 인식해 로그인 쿠키를 `Secure`로 보냄 |

| 확인 항목 | 결과 | 증빙 |
|---|---|---|
| 배포 URL 접속 → 로그인 화면, 로그인 전 API는 401 | 통과 | [C1-배포-로그인화면](docs/screenshots/C1-배포-로그인화면.png) |
| 계정 A로 로그인 → 계정 B의 할 일 3개가 보이지 않음 | 통과 | [C2-배포-계정A-B의할일안보임](docs/screenshots/C2-배포-계정A-B의할일안보임.png) |
| 배포 서버에서 할 일 추가 → 새로고침 후에도 남음 | 통과 | [C3-배포-추가후-새로고침유지](docs/screenshots/C3-배포-추가후-새로고침유지.png) |
| 배포 서버 대상 RLS 확인 (`BASE_URL` 지정 후 `npm run rls-check`) | 11건 모두 통과 | [rls-check-result-render.txt](docs/rls-check-result-render.txt) |

**로컬 vs 클라우드 정리:** DB 저장 위치를 Supabase로 바꾼 것(길 B)과 앱을 인터넷에 공개한 것(Render 배포)은 별개의 일이다. 로컬 서버와 Render 서버가 같은 Supabase를 쓰기 때문에, 어느 쪽에서 로그인해도 같은 할 일이 보인다.

## 회고

- **새로고침해도 남아야 할 데이터와 역할 분담:** 할 일의 제목·완료 여부·마감일과 그 주인. 백엔드는 요청을 받아 입력을 검사하고 누구의 요청인지 확인하며, DB는 그 결과를 남기고 조건에 맞는 것을 찾아 준다.
- **DB가 발전한 이유 하나:** 파일에 따로따로 적으면 같은 정보가 여러 곳에 흩어지고 서로 어긋난다. 관계형 DB는 표와 키로 정보를 한 곳에만 두고 관계로 이어서 이 문제를 풀었다.
- **내 표·항목·관계:** `todos` 표 하나(id, user_id, title, done, due_date, created_at). 사용자 1명이 할 일 여러 개를 갖는 1:N 관계다. '오늘 할 일'은 `SELECT * FROM todos WHERE due_date = '2026-10-29'`이고, 길 B에서는 RLS가 `AND user_id = 나`를 자동으로 붙여 준다.
- **자기 할 일만 보게 하려면:** 서버가 로그인 토큰이 진짜인지 Supabase에 확인하고, DB는 RLS로 `auth.uid() = user_id`인 행만 허용한다. 백엔드와 DB가 두 겹으로 지킨다.
- **SQL 주입·비밀번호 유출 방지, 복구:** 파라미터화 쿼리, 비밀번호는 직접 저장하지 않고 Supabase Auth에 맡김(해시 저장), 키는 `.env`와 Render 환경변수에만 둠. Supabase Free는 자동 백업이 없어서, 중요한 데이터라면 직접 백업(덤프)하고 복구까지 해 봐야 한다.
- **고른 DB의 무료 한도와 백업:** Supabase Free는 DB 500MB, 1주 미사용 시 일시정지, 자동 백업 없음. Render Free는 15분 미사용 시 잠듦.
- **로컬과 Supabase에서 새로고침 후 남았나:** 둘 다 남았다. 로컬은 서버 재시작 후에도 `todo.db`에 그대로 있었고(A3), Supabase는 서버 재시작과 Render 배포 서버 양쪽에서 그대로였다(B3, C3).
