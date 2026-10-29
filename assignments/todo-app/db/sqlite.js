// 길 A: 로컬 SQLite 저장소 (Node 내장 node:sqlite)
// 모든 쿼리는 ? 자리에 값을 따로 넘기는 파라미터화 쿼리로 실행한다.
import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync(process.env.DB_FILE || 'todo.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
    done       INTEGER NOT NULL DEFAULT 0 CHECK (done IN (0, 1)),
    due_date   TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

const ORDER = 'ORDER BY due_date IS NULL, due_date, created_at';

// DB의 0/1을 화면에서 쓰기 쉬운 true/false로 바꾼다
const toTodo = (row) => row && { ...row, done: row.done === 1 };

// 로컬 모드는 로그인이 없어서 첫 인자(ctx, 요청한 사용자 정보)를 쓰지 않는다.
// Supabase 저장소(db/supabase.js)와 같은 모양으로 맞춰 server.js가 둘을 바꿔 끼울 수 있게 한다.
export function listTodos(ctx, { dueDate } = {}) {
  const rows = dueDate
    ? db.prepare(`SELECT * FROM todos WHERE due_date = ? ${ORDER}`).all(dueDate)
    : db.prepare(`SELECT * FROM todos ${ORDER}`).all();
  return rows.map(toTodo);
}

export function createTodo(ctx, { title, dueDate }) {
  const row = db
    .prepare('INSERT INTO todos (title, due_date) VALUES (?, ?) RETURNING *')
    .get(title, dueDate);
  return toTodo(row);
}

export function setDone(ctx, id, done) {
  const row = db
    .prepare('UPDATE todos SET done = ? WHERE id = ? RETURNING *')
    .get(done ? 1 : 0, id);
  return toTodo(row);
}

export function deleteTodo(ctx, id) {
  return db.prepare('DELETE FROM todos WHERE id = ?').run(id).changes > 0;
}
