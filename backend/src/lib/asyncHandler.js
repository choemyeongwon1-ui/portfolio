// ==========================================
// 비동기 컨트롤러 감싸개
// ------------------------------------------
// Express 4는 async 함수 안에서 난 오류를 스스로 잡지 못한다.
// 모든 컨트롤러를 이 함수로 감싸두면 오류가 errorHandler로 잘 전달된다.
// ==========================================

export function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
