// ==========================================
// 프론트엔드 설정
// ------------------------------------------
// API 주소를 여기 한곳에서만 정한다.
// 나중에 백엔드를 다른 서버에 올리면 이 값만 바꾸면 된다.
// ==========================================

// index.html의 <body data-api-base="..."> 값을 먼저 쓰고,
// 없으면 같은 서버의 /api 를 쓴다.
const fromHtml = document.body?.dataset?.apiBase;

export const config = {
  apiBaseUrl: (fromHtml || '/api').replace(/\/$/, ''),

  // 요청이 이 시간을 넘기면 포기한다 (밀리초)
  requestTimeout: 8000
};
