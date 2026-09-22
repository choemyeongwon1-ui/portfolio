// ==========================================
// 프론트엔드 설정
// ------------------------------------------
// API 주소를 여기 한곳에서만 정한다.
// ==========================================

// ★ Vercel에 올라간 백엔드의 주소.
//   github.io 에서 이 사이트를 열면 같은 서버에 백엔드가 없으므로,
//   대신 이 주소로 API를 부른다.
//   Vercel 프로젝트의 "Production" 주소가 바뀌면 이 값만 고치면 된다.
//   (Vercel 대시보드 → Settings → Domains 에서 확인)
const PRODUCTION_API_BASE = 'https://portfolio-choemyeongwon1-ui.vercel.app/api';

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

export const config = {
  apiBaseUrl: resolveApiBase().replace(/\/$/, ''),

  // 요청이 이 시간을 넘기면 포기한다 (밀리초)
  requestTimeout: 8000
};
