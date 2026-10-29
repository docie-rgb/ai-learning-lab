// RLS 확인 스크립트: 계정 A의 할 일을 계정 B가 보거나 바꾸거나 지울 수 없는지 확인한다.
// 실행: 서버를 Supabase 모드로 켠 상태에서  npm run rls-check
// 필요한 .env 값: SUPABASE_URL, SUPABASE_KEY, TEST_A_EMAIL, TEST_A_PASSWORD, TEST_B_EMAIL, TEST_B_PASSWORD
import { createClient } from '@supabase/supabase-js';

const env = process.env;
const BASE = env.BASE_URL || `http://localhost:${env.PORT || 3000}`;
for (const key of ['SUPABASE_URL', 'SUPABASE_KEY', 'TEST_A_EMAIL', 'TEST_A_PASSWORD', 'TEST_B_EMAIL', 'TEST_B_PASSWORD']) {
  if (!env[key]) {
    console.error(`.env에 ${key} 값이 없습니다.`);
    process.exit(1);
  }
}

const results = [];
function check(name, pass, detail) {
  results.push({ 확인: name, 결과: pass ? '통과' : '실패', 내용: detail });
}

// ---- 1. 백엔드 API를 거친 확인 ----
async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`${email} 로그인 실패 (${res.status}) - 서버가 Supabase 모드로 켜져 있는지 확인하세요.`);
  const cookie = res.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  return (path, init = {}) =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Cookie: cookie, ...init.headers },
    });
}

const asA = await login(env.TEST_A_EMAIL, env.TEST_A_PASSWORD);
const asB = await login(env.TEST_B_EMAIL, env.TEST_B_PASSWORD);

const created = await (await asA('/api/todos', {
  method: 'POST',
  body: JSON.stringify({ title: 'A의 RLS 확인용 할 일' }),
})).json();
check('A가 할 일 추가', Number.isInteger(created.id), `id ${created.id}`);

const bList = await (await asB('/api/todos')).json();
check('[API] B의 목록에 A의 할 일이 없음', !bList.some((t) => t.id === created.id), `B가 받은 목록 ${bList.length}개`);

const bPatch = await asB(`/api/todos/${created.id}`, { method: 'PATCH', body: JSON.stringify({ done: true }) });
check('[API] B가 A의 할 일 완료 처리 → 거절', bPatch.status === 404, `HTTP ${bPatch.status}`);

const bDelete = await asB(`/api/todos/${created.id}`, { method: 'DELETE' });
check('[API] B가 A의 할 일 삭제 → 거절', bDelete.status === 404, `HTTP ${bDelete.status}`);

const noLogin = await fetch(`${BASE}/api/todos`);
check('[API] 로그인 없이 목록 요청 → 거절', noLogin.status === 401, `HTTP ${noLogin.status}`);

// ---- 2. 백엔드를 건너뛰고 Supabase에 직접 요청해도 RLS가 막는지 ----
const options = { auth: { persistSession: false, autoRefreshToken: false } };

const anon = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, options);
const anonRead = await anon.from('todos').select('id');
check('[DB 직접] 로그인 없이 todos 조회 → 0행 또는 거절', !!anonRead.error || anonRead.data.length === 0,
  anonRead.error ? `거절: ${anonRead.error.code}` : `${anonRead.data.length}행`);

const b = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, options);
await b.auth.signInWithPassword({ email: env.TEST_B_EMAIL, password: env.TEST_B_PASSWORD });

const bRead = await b.from('todos').select('id').eq('id', created.id);
check('[DB 직접] B 토큰으로 A의 행 조회 → 0행', !bRead.error && bRead.data.length === 0, `${bRead.data?.length ?? 'error'}행`);

const bUpdate = await b.from('todos').update({ title: 'B가 바꿈' }).eq('id', created.id).select();
check('[DB 직접] B 토큰으로 A의 행 수정 → 0행', !bUpdate.error && bUpdate.data.length === 0, `${bUpdate.data?.length ?? 'error'}행 변경`);

const bSteal = await b.from('todos').insert({ user_id: created.user_id, title: 'A 이름으로 몰래 추가' }).select();
check('[DB 직접] B가 A 소유로 행 추가 → 거절', !!bSteal.error, bSteal.error ? `거절: ${bSteal.error.code}` : '추가됨!');

const bDel = await b.from('todos').delete().eq('id', created.id).select();
check('[DB 직접] B 토큰으로 A의 행 삭제 → 0행', !bDel.error && bDel.data.length === 0, `${bDel.data?.length ?? 'error'}행 삭제`);

// ---- 3. A의 할 일은 처음 그대로인지 ----
const aList = await (await asA('/api/todos')).json();
const mine = aList.find((t) => t.id === created.id);
check('A의 할 일이 원래대로 남아 있음', mine && mine.title === 'A의 RLS 확인용 할 일' && mine.done === false,
  mine ? `title="${mine.title}", done=${mine.done}` : '사라짐!');

// 정리: 확인용 할 일 삭제
await asA(`/api/todos/${created.id}`, { method: 'DELETE' });

console.log(`\nRLS 확인 (${new Date().toLocaleString('ko-KR')}, 서버 ${BASE})`);
console.table(results);
const failed = results.filter((r) => r.결과 !== '통과').length;
console.log(failed ? `실패 ${failed}건` : `전체 ${results.length}건 통과`);
process.exit(failed ? 1 : 0);
