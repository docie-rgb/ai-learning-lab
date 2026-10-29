// 길 B: 로그인 (Supabase Auth)
// 비밀번호 확인·저장(해시)은 직접 만들지 않고 Supabase Auth에 맡긴다.
// 로그인 토큰은 화면 JS가 읽을 수 없는 httpOnly 쿠키에 담아, 브라우저가 백엔드에만 보내게 한다.
import express from 'express';
import { authClient } from './db/supabase.js';

const ACCESS = 'sb_access';
const REFRESH = 'sb_refresh';

function cookieOptions(req, maxAgeMs) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: req.secure, // 배포(https)에서는 https로만 전송
    path: '/',
    maxAge: maxAgeMs,
  };
}

function saveSession(req, res, session) {
  res.cookie(ACCESS, session.access_token, cookieOptions(req, session.expires_in * 1000));
  res.cookie(REFRESH, session.refresh_token, cookieOptions(req, 30 * 24 * 60 * 60 * 1000));
}

function clearSession(req, res) {
  res.clearCookie(ACCESS, cookieOptions(req));
  res.clearCookie(REFRESH, cookieOptions(req));
}

// 쿠키의 토큰이 진짜인지 Supabase에 확인한다. 만료됐으면 refresh 토큰으로 새로 받는다.
async function currentUser(req, res) {
  const access = req.cookies[ACCESS];
  if (access) {
    const { data, error } = await authClient.auth.getUser(access);
    if (!error && data.user) return { user: data.user, accessToken: access };
  }

  const refresh = req.cookies[REFRESH];
  if (refresh) {
    const { data, error } = await authClient.auth.refreshSession({ refresh_token: refresh });
    if (!error && data.session) {
      saveSession(req, res, data.session);
      return { user: data.user, accessToken: data.session.access_token };
    }
  }
  return null;
}

// /api/todos 앞에 붙는 문지기: 로그인하지 않았으면 401
export async function requireUser(req, res, next) {
  const ctx = await currentUser(req, res);
  if (!ctx) {
    clearSession(req, res);
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  req.ctx = ctx;
  next();
}

function readCredentials(req, res) {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    res.status(400).json({ error: '이메일 형식을 확인하세요.' });
    return null;
  }
  if (password.length < 6 || password.length > 72) {
    res.status(400).json({ error: '비밀번호는 6~72자로 입력하세요.' });
    return null;
  }
  return { email, password };
}

export const authRouter = express.Router();

// 현재 로그인 상태
authRouter.get('/me', async (req, res) => {
  const ctx = await currentUser(req, res);
  res.json({ user: ctx ? { email: ctx.user.email } : null });
});

authRouter.post('/signup', async (req, res) => {
  const creds = readCredentials(req, res);
  if (!creds) return;
  const { data, error } = await authClient.auth.signUp(creds);
  if (error) {
    console.error('signup:', error.message);
    return res.status(400).json({ error: '회원가입에 실패했습니다. 이미 가입한 이메일인지 확인하세요.' });
  }
  if (!data.session) {
    // Supabase에서 이메일 확인이 켜져 있으면 메일의 링크를 눌러야 로그인할 수 있다
    return res.status(202).json({ message: '확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인하세요.' });
  }
  saveSession(req, res, data.session);
  res.status(201).json({ user: { email: data.user.email } });
});

authRouter.post('/login', async (req, res) => {
  const creds = readCredentials(req, res);
  if (!creds) return;
  const { data, error } = await authClient.auth.signInWithPassword(creds);
  if (error) {
    console.error('login:', error.message);
    return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }
  saveSession(req, res, data.session);
  res.json({ user: { email: data.user.email } });
});

authRouter.post('/logout', (req, res) => {
  clearSession(req, res);
  res.status(204).end();
});
