// ==========================================
// 로그인 세션 보관
// ------------------------------------------
// 로그인에 성공하면 임의의 긴 문자열(토큰)을 하나 만들어 돌려준다.
// 이후 관리자 요청은 비밀번호가 아니라 이 토큰을 들고 온다.
// 비밀번호가 화면이나 네트워크에 반복해서 돌아다니지 않게 하기 위해서다.
//
// 토큰은 서버 메모리에만 두기 때문에 서버를 껐다 켜면 사라진다.
// (그때는 다시 로그인하면 된다)
// ==========================================

import crypto from 'node:crypto';

const sessions = new Map();

/** 새 토큰을 만들고 보관한다. */
export function createSession(ttlMs) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expiresAt: Date.now() + ttlMs });
  return token;
}

/** 토큰이 살아 있는지 확인한다. 쓸 때마다 만료 시간을 늘려준다. */
export function touchSession(token, ttlMs) {
  if (!token) return false;

  const session = sessions.get(token);
  if (!session) return false;

  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return false;
  }

  session.expiresAt = Date.now() + ttlMs;
  return true;
}

/** 로그아웃 */
export function destroySession(token) {
  sessions.delete(token);
}

/** 만료된 토큰을 주기적으로 치운다. */
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions) {
    if (session.expiresAt < now) sessions.delete(token);
  }
}, 10 * 60 * 1000);

// 이 타이머 때문에 서버가 종료되지 않는 일이 없도록 한다.
cleanupTimer.unref();
