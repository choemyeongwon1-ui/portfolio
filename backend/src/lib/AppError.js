// ==========================================
// 애플리케이션 오류 (AppError)
// ------------------------------------------
// 서비스 계층에서 "없는 프로젝트를 찾았다" 같은 상황을 던지면,
// errorHandler 미들웨어가 이 정보를 읽어 알맞은 HTTP 응답으로 바꾼다.
// 이렇게 해두면 서비스 코드가 res 객체를 몰라도 된다.
// ==========================================

export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', cause, details } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    // 어느 칸이 왜 잘못됐는지 화면에 알려줄 때 쓴다.
    // 예: [{ field: 'title', message: '공개하려면 제목을 입력해야 합니다.' }]
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = '요청한 자료를 찾을 수 없습니다.') {
    super(message, { status: 404, code: 'NOT_FOUND' });
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = '요청 형식이 올바르지 않습니다.', details) {
    super(message, { status: 400, code: 'BAD_REQUEST', details });
    this.name = 'BadRequestError';
  }
}

/**
 * 이미 있는 것과 부딪힐 때 쓴다 (예: 중복 프로젝트).
 * 잘못된 요청이 아니라 "판단이 필요한 상황"이므로 400이 아니라 409를 쓴다.
 */
export class ConflictError extends AppError {
  constructor(message, { duplicate } = {}) {
    super(message, { status: 409, code: 'DUPLICATE_PROJECT' });
    this.name = 'ConflictError';
    // 화면에서 "통합할까요?" 를 물어보려면 상대 프로젝트가 필요하다.
    this.duplicate = duplicate;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '로그인이 필요합니다.') {
    super(message, { status: 401, code: 'UNAUTHORIZED' });
    this.name = 'UnauthorizedError';
  }
}
