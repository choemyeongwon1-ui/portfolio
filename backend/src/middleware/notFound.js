// ==========================================
// 없는 API 경로 처리
// ==========================================

import { NotFoundError } from '../lib/AppError.js';

export function notFound(req, res, next) {
  next(new NotFoundError(`존재하지 않는 경로입니다: ${req.method} ${req.originalUrl}`));
}
