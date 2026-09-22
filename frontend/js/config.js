// ==========================================
// 프론트엔드 설정
// ------------------------------------------
// API 주소를 여기 한곳에서만 정한다.
// ==========================================

// ★ Render에 올라간 백엔드의 주소.
//   github.io, Vercel 등 정적 호스팅에서 이 사이트를 열면 같은 서버에
//   백엔드가 없으므로, 대신 이 주소로 API를 부른다.
//   render.yaml 의 서비스 이름(portfolio-backend)을 기준으로 만들어지는
//   기본 주소를 적어 뒀다. Render가 실제로 다른 주소를 배정했다면
//   (대시보드 맨 위에 표시됨) 이 한 줄만 그 주소로 바꾸면 된다.
const PRODUCTION_API_BASE = 'https://portfolio-backend-ehgr.onrender.com/api';

function resolveApiBase() {
  // index.html의 <body data-api-base="..."> 값이 있으면 그걸 최우선으로 쓴다.
  // (로컬 개발 시 index.html이 이 값을 "/api"로 지정해 둔다)
  const fromHtml = document.body?.dataset?.apiBase;
  if (fromHtml) return fromHtml;

  // 명시된 값이 없는데 localhost가 아니면(=github.io 등 정적 호스팅),
  // 같은 서버에 백엔드가 없다고 보고 Vercel 주소를 쓴다.
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  return isLocal ? '/api' : PRODUCTION_API_BASE;
}

const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const config = {
  apiBaseUrl: resolveApiBase().replace(/\/$/, ''),

  // 요청이 이 시간을 넘기면 포기한다 (밀리초).
  //
  // Render 무료 플랜은 15분 동안 요청이 없으면 서버를 재운다.
  // 다음 요청이 오면 다시 깨우는 데 최대 1분 가까이 걸릴 수 있어서,
  // 배포된 사이트(로컬이 아닌 곳)에서는 넉넉하게 기다려 준다.
  // 로컬 개발 중에는 문제를 빨리 알아채도록 짧게 유지한다.
  requestTimeout: isLocal ? 8000 : 45000
};
