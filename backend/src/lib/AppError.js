// ==========================================
// 애플리케이션 오류 (AppError)
// ------------------------------------------
// 서비스 계층에서 "없는 프로젝트를 찾았다" 같은 상황을 던지면,
// errorHandler 미들웨어가 이 정보를 읽어 알맞은 HTTP 응답으로 바꾼다.
// 이렇게 해두면 서비스 코드가 res 객체를 몰라도 된다.
// ==========================================

export class AppError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL_ERROR', cause } = {}) {
    super(message, { cause });
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = '요청한 자료를 찾을 수 없습니다.') {
    super(message, { status: 404, code: 'NOT_FOUND' });
    this.name = 'NotFoundError';
  }
}

export class BadRequestError extends AppError {
  constructor(message = '요청 형식이 올바르지 않습니다.') {
    super(message, { status: 400, code: 'BAD_REQUEST' });
    this.name = 'BadRequestError';
  }
}
