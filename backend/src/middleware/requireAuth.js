// ==========================================
// 로그인 확인
// ------------------------------------------
// 관리자 전용 요청 앞에 세워두면, 토큰이 없거나 만료된 요청을 막는다.
// 여기를 통과하지 못하면 컨트롤러까지 가지도 않는다.
// ==========================================

import { config } from '../config/index.js';
import { touchSession } from '../lib/sessions.js';
import { UnauthorizedError } from '../lib/AppError.js';

function readToken(req) {
  const header = req.get('authorization') ?? '';
  const [scheme, value] = header.split(' ');

  if (scheme?.toLowerCase() === 'bearer' && value) return value.trim();
  return '';
}

export function requireAuth(req, res, next) {
  const token = readToken(req);

  if (!touchSession(token, config.admin.sessionTtlMs)) {
    return next(new UnauthorizedError('로그인이 필요하거나 로그인 시간이 만료되었습니다.'));
  }

  req.adminToken = token;
  next();
}
