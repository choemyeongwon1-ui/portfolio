// ==========================================
// Vercel 서버리스 진입점
// ------------------------------------------
// backend/src/server.js 는 "계속 켜져 있는 서버"를 만들지만,
// Vercel은 요청이 올 때마다 함수를 부르는 방식(서버리스)이라 그 코드를 쓸 수 없다.
//
// 다행히 우리가 만든 Express 앱(createApp())은 요청 하나를 받아 응답하는
// 함수와 똑같이 생겼다. 그래서 켜고 기다리는 부분(app.listen)만 빼고
// 앱 자체를 그대로 내보내면, Vercel이 알아서 요청마다 불러 쓴다.
//
// vercel.json 이 /api/* 요청을 전부 이 파일로 보낸다.
//
// ★ 이 함수 안에서는 ENABLE_ADMIN=false 로 관리자 기능이 꺼져 있다.
//   이유는 backend/src/config/index.js 의 admin.enabled 주석 참고.
// ==========================================

import { createApp } from '../backend/src/app.js';

const app = createApp();

export default app;
