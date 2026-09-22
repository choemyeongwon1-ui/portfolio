// ==========================================
// 관리자 로그인 서비스
// ------------------------------------------
// 비밀번호는 이 파일 바깥으로 절대 나가지 않는다.
// 응답으로 돌려주는 것은 토큰뿐이며, 토큰으로는 비밀번호를 알 수 없다.
// ==========================================

import { config } from '../config/index.js';
import { verifyPassword } from '../lib/password.js';
import { createSession, destroySession } from '../lib/sessions.js';
import { UnauthorizedError, AppError } from '../lib/AppError.js';

// 너무 빠른 반복 시도를 늦춘다 (비밀번호 찍어보기 방지)
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function tooManyAttempts(key) {
  const record = attempts.get(key);
  if (!record) return false;

  if (Date.now() - record.firstAt > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }

  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(key) {
  const record = attempts.get(key);

  if (!record || Date.now() - record.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: Date.now() });
    return;
  }

  record.count += 1;
}

export const authService = {
  /** 비밀번호가 아예 설정되지 않았는지 확인한다. */
  isConfigured() {
    return Boolean(config.admin.passwordHash || config.admin.passwordPlain);
  },

  /**
   * 로그인. 성공하면 토큰을 돌려준다.
   * @param {string} password
   * @param {string} clientKey 시도 횟수를 세는 기준 (보통 IP)
   */
  login(password, clientKey = 'unknown') {
    if (!this.isConfigured()) {
      throw new AppError(
        '관리자 비밀번호가 설정되지 않았습니다. 터미널에서 npm run set-password 를 실행하세요.',
        { status: 503, code: 'ADMIN_NOT_CONFIGURED' }
      );
    }

    if (tooManyAttempts(clientKey)) {
      throw new AppError('로그인 시도가 너무 많습니다. 10분 뒤에 다시 시도해 주세요.', {
        status: 429,
        code: 'TOO_MANY_ATTEMPTS'
      });
    }

    const ok = config.admin.passwordHash
      ? verifyPassword(password, config.admin.passwordHash)
      : password === config.admin.passwordPlain && password.length > 0;

    if (!ok) {
      recordFailure(clientKey);
      // 어떤 부분이 틀렸는지 알려주지 않는다.
      throw new UnauthorizedError('비밀번호가 올바르지 않습니다.');
    }

    attempts.delete(clientKey);

    return {
      token: createSession(config.admin.sessionTtlMs),
      expiresInMinutes: Math.round(config.admin.sessionTtlMs / 60000)
    };
  },

  logout(token) {
    destroySession(token);
    return { ok: true };
  }
};
