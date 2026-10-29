// 백엔드: 화면(public/)의 요청을 받아 검사하고, DB에 읽고 쓴 뒤 응답한다.
// DB에 접근하는 코드는 이 서버 쪽(db/)에만 있다.
//   DB_PROVIDER=sqlite   → 길 A: 로컬 todo.db (로그인 없음)
//   DB_PROVIDER=supabase → 길 B: Supabase + 로그인 + RLS
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3000;
const PROVIDER = process.env.DB_PROVIDER === 'supabase' ? 'supabase' : 'sqlite';
const authRequired = PROVIDER === 'supabase';

const store = await import(authRequired ? './db/supabase.js' : './db/sqlite.js');

app.set('trust proxy', 1); // Render 같은 프록시 뒤에서 https 여부(req.secure)를 알 수 있게
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// 화면이 로그인 화면을 띄울지 정할 수 있게 현재 모드를 알려 준다
app.get('/api/config', (req, res) => {
  res.json({ provider: PROVIDER, authRequired });
});

if (authRequired) {
  const { authRouter, requireUser } = await import('./auth.js');
  app.use('/api/auth', authRouter);
  app.use('/api/todos', requireUser);
}

// ---- 입력 검사 (프론트는 믿지 않는다) ----
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: '잘못된 id입니다.' });
    return null;
  }
  return id;
}

// ---- API (CRUD) ----
// req.ctx: 로그인한 사용자 정보 (로컬 모드에서는 없음)

// 목록 보기: ?date=YYYY-MM-DD 를 주면 그날 마감인 할 일만 (오늘 할 일 보기)
app.get('/api/todos', async (req, res) => {
  const { date } = req.query;
  if (date !== undefined && !isValidDate(date)) {
    return res.status(400).json({ error: '날짜는 YYYY-MM-DD 형식이어야 합니다.' });
  }
  res.json(await store.listTodos(req.ctx, { dueDate: date }));
});

// 할 일 추가
app.post('/api/todos', async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  const dueDate = req.body?.dueDate || null;

  if (!title) return res.status(400).json({ error: '할 일 제목을 입력하세요.' });
  if (title.length > 200) return res.status(400).json({ error: '제목은 200자 이하로 입력하세요.' });
  if (dueDate !== null && !isValidDate(dueDate)) {
    return res.status(400).json({ error: '마감일은 YYYY-MM-DD 형식이어야 합니다.' });
  }

  res.status(201).json(await store.createTodo(req.ctx, { title, dueDate }));
});

// 완료 표시
app.patch('/api/todos/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  if (typeof req.body?.done !== 'boolean') {
    return res.status(400).json({ error: 'done 값은 true 또는 false여야 합니다.' });
  }
  const todo = await store.setDone(req.ctx, id, req.body.done);
  if (!todo) return res.status(404).json({ error: '할 일을 찾을 수 없습니다.' });
  res.json(todo);
});

// 삭제
app.delete('/api/todos/:id', async (req, res) => {
  const id = parseId(req, res);
  if (id === null) return;
  if (!(await store.deleteTodo(req.ctx, id))) {
    return res.status(404).json({ error: '할 일을 찾을 수 없습니다.' });
  }
  res.status(204).end();
});

// 예상 못 한 오류는 내부 내용을 숨기고 응답 (자세한 내용은 서버 로그에만)
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: status === 400 ? '요청 형식이 올바르지 않습니다.' : '서버 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`Todo 앱 실행 중 (${PROVIDER}): http://localhost:${PORT}`);
});
