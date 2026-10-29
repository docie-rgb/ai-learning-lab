// 길 B: Supabase(클라우드 Postgres) 저장소
// 요청마다 "로그인한 사용자의 토큰"으로 Supabase를 부른다.
// 그래서 DB의 RLS 정책이 그 사용자 기준으로 적용되고, 남의 할 일은 읽히지도 바뀌지도 않는다.
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('.env에 SUPABASE_URL과 SUPABASE_KEY를 설정하세요.');
}

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};

// 로그인·회원가입·토큰 확인용 (사용자 세션을 서버에 저장하지 않음)
export const authClient = createClient(SUPABASE_URL, SUPABASE_KEY, clientOptions);

// ctx.accessToken: auth.js가 확인한 로그인 사용자의 토큰
function dbFor(ctx) {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    ...clientOptions,
    global: { headers: { Authorization: `Bearer ${ctx.accessToken}` } },
  }).from('todos');
}

// 라이브러리 오류는 그대로 화면에 보내지 않고 서버 로그에만 남긴다
function check({ data, error }) {
  if (error) throw error;
  return data;
}

export async function listTodos(ctx, { dueDate } = {}) {
  let query = dbFor(ctx)
    .select('*')
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });
  if (dueDate) query = query.eq('due_date', dueDate);
  return check(await query);
}

export async function createTodo(ctx, { title, dueDate }) {
  return check(
    await dbFor(ctx)
      .insert({ user_id: ctx.user.id, title, due_date: dueDate })
      .select()
      .single(),
  );
}

// 남의 할 일이면 RLS 때문에 0행이 바뀌고 null이 돌아간다 → 404
export async function setDone(ctx, id, done) {
  return check(await dbFor(ctx).update({ done }).eq('id', id).select().maybeSingle());
}

export async function deleteTodo(ctx, id) {
  const rows = check(await dbFor(ctx).delete().eq('id', id).select('id'));
  return rows.length > 0;
}
