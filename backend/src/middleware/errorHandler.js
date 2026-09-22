// ==========================================
// 오류 응답 처리
// ------------------------------------------
// 어디서 난 오류든 마지막에는 여기로 모인다.
// 응답 형태를 한 가지로 통일해 두면 프론트엔드가 처리하기 쉽다.
//   { "error": { "code": "...", "message": "..." } }
// ==========================================

import { config } from '../config/index.js';

// eslint-disable-next-line no-unused-vars -- Express는 인자 4개짜리를 오류 미들웨어로 인식한다
export function errorHandler(error, req, res, next) {
  const status = error.status ?? 500;
  const code = error.code ?? 'INTERNAL_ERROR';
  const message =
    status === 500 && config.env === 'production'
      ? '서버에서 문제가 발생했습니다.'
      : error.message;

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
  }

  res.status(status).json({
    error: {
      code,
      message,
      // 어느 칸이 잘못됐는지 화면이 표시할 수 있게 함께 보낸다.
      ...(error.details ? { details: error.details } : {}),
      // 중복일 때는 상대 프로젝트도 함께 보낸다 (통합 여부를 물어보기 위해).
      ...(error.duplicate ? { duplicate: error.duplicate } : {}),
      ...(config.env === 'development' && error.stack ? { stack: error.stack } : {})
    }
  });
}
