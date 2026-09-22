// ==========================================
// 서버 진입점
// ------------------------------------------
// 실행:  npm run dev   (파일을 고치면 자동 재시작)
//        npm start     (일반 실행)
// ==========================================

import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log('');
  console.log('  포트폴리오 서버가 시작되었습니다.');
  console.log(`  주소        http://localhost:${config.port}`);
  console.log(`  API         http://localhost:${config.port}/api/health`);
  console.log(`  데이터 소스  ${config.dataSource}`);
  console.log(`  실행 모드    ${config.env}`);
  if (config.serveFrontend) {
    console.log('  프론트엔드   같은 주소에서 함께 제공됩니다.');
  }
  console.log('');
});

// Ctrl+C 로 껐을 때 깔끔하게 정리한다.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`\n${signal} 수신 — 서버를 종료합니다.`);
    server.close(() => process.exit(0));
  });
}
