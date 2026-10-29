-- 길 B: Supabase SQL Editor에 붙여넣고 Run 한 번 실행한다.
-- 할 일 표 + 사용자별 접근 제한(RLS)

create table if not exists public.todos (
  id         bigint generated always as identity primary key,
  user_id    uuid        not null default auth.uid()
                         references auth.users (id) on delete cascade,
  title      text        not null check (char_length(btrim(title)) between 1 and 200),
  done       boolean     not null default false,
  due_date   date,
  created_at timestamptz not null default now()
);

-- 모든 조회가 "내 할 일만"이라 user_id로 빨리 찾도록 색인
create index if not exists todos_user_id_idx on public.todos (user_id);

-- RLS 켜기: 아래 정책에 맞는 행만 읽고 쓸 수 있다 (정책이 없으면 전부 거절)
alter table public.todos enable row level security;

-- 로그인한 사용자(authenticated)만, 자기 행(auth.uid() = user_id)에만
drop policy if exists "todos_select_own" on public.todos;
create policy "todos_select_own" on public.todos
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "todos_insert_own" on public.todos;
create policy "todos_insert_own" on public.todos
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "todos_update_own" on public.todos;
create policy "todos_update_own" on public.todos
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "todos_delete_own" on public.todos;
create policy "todos_delete_own" on public.todos
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- 로그인하지 않은 요청(anon)은 표 자체에 접근할 수 없게 한다
revoke all on public.todos from anon;
grant select, insert, update, delete on public.todos to authenticated;
