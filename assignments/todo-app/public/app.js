// 화면 코드: DB를 직접 부르지 않고, 백엔드 API(/api/todos)에만 요청한다.
const $ = (sel) => document.querySelector(sel);
const form = $('#add-form');
const titleInput = $('#title');
const dueInput = $('#due');
const list = $('#list');
const errorBox = $('#error');

let filter = 'all';

// 사용자 컴퓨터 기준 오늘 날짜 (YYYY-MM-DD)
function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 로그인 토큰은 httpOnly 쿠키라 이 코드에서는 볼 수 없고, 브라우저가 알아서 백엔드에 함께 보낸다
async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (res.status === 401 && !path.startsWith('/api/auth/')) {
    showLogin();
    throw new Error('로그인이 필요합니다.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `요청 실패 (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = !message;
}

function formatDue(due) {
  const [, m, d] = due.split('-');
  return `${Number(m)}월 ${Number(d)}일`;
}

function render(todos) {
  const t = today();
  list.replaceChildren(
    ...todos.map((todo) => {
      const li = document.createElement('li');
      li.className = 'item';
      li.classList.toggle('done', todo.done);
      li.classList.toggle('overdue', !todo.done && todo.due_date && todo.due_date < t);

      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = todo.done;
      check.setAttribute('aria-label', '완료 표시');
      check.addEventListener('change', () => toggle(todo.id, check.checked));

      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = todo.title; // textContent라 입력값이 HTML로 해석되지 않는다

      const due = document.createElement('span');
      due.className = 'due';
      if (todo.due_date) {
        due.textContent = todo.due_date === t ? '오늘' : formatDue(todo.due_date);
        if (!todo.done && todo.due_date < t) due.textContent += ' · 지남';
      }

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'delete';
      del.textContent = '삭제';
      del.addEventListener('click', () => remove(todo.id));

      li.append(check, title, due, del);
      return li;
    }),
  );

  const left = todos.filter((x) => !x.done).length;
  $('#count').textContent = `${todos.length}개 중 ${left}개 남음`;
  $('#empty').hidden = todos.length > 0;
}

async function load() {
  try {
    const query = filter === 'today' ? `?date=${today()}` : '';
    render(await api(`/api/todos${query}`));
    showError('');
  } catch (err) {
    showError(err.message);
  }
}

async function toggle(id, done) {
  try {
    await api(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify({ done }) });
  } catch (err) {
    showError(err.message);
  }
  load();
}

async function remove(id) {
  try {
    await api(`/api/todos/${id}`, { method: 'DELETE' });
  } catch (err) {
    showError(err.message);
  }
  load();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/todos', {
      method: 'POST',
      body: JSON.stringify({ title: titleInput.value, dueDate: dueInput.value || null }),
    });
    titleInput.value = '';
    dueInput.value = '';
    titleInput.focus();
    load();
  } catch (err) {
    showError(err.message);
  }
});

document.querySelectorAll('.filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    document.querySelectorAll('.filter').forEach((b) => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-selected', String(b === btn));
    });
    load();
  });
});

// ---- 로그인 (Supabase 모드에서만) ----
const loginForm = $('#login-form');
const loginMessage = $('#login-message');

function showLogin() {
  $('#todo-view').hidden = true;
  $('#account').hidden = true;
  $('#login-view').hidden = false;
  list.replaceChildren();
}

function showTodos(user) {
  $('#login-view').hidden = true;
  $('#todo-view').hidden = false;
  if (user) {
    $('#user-email').textContent = user.email;
    $('#account').hidden = false;
  }
  load();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const mode = e.submitter?.dataset.mode === 'signup' ? 'signup' : 'login';
  loginMessage.hidden = true;
  try {
    const result = await api(`/api/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify({ email: $('#email').value, password: $('#password').value }),
    });
    $('#password').value = '';
    showError('');
    if (result.user) {
      showTodos(result.user);
    } else {
      loginMessage.textContent = result.message;
      loginMessage.hidden = false;
    }
  } catch (err) {
    showError(err.message);
  }
});

$('#logout').addEventListener('click', async () => {
  await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  showError('');
  showLogin();
});

async function start() {
  $('#today-label').textContent = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });
  try {
    const config = await api('/api/config');
    if (!config.authRequired) return showTodos(null);
    const { user } = await api('/api/auth/me');
    user ? showTodos(user) : showLogin();
  } catch (err) {
    showError(err.message);
  }
}

start();
