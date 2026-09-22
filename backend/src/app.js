// ==========================================
// Express 앱 구성
// ------------------------------------------
// 서버를 "켜는" 일(server.js)과 "무엇을 하는지 정하는" 일(app.js)을 나눴다.
// 이렇게 해두면 나중에 테스트 코드에서 app만 가져다 쓸 수 있다.
// ==========================================

import path from 'node:path';
import express from 'express';
import cors from 'cors';

import { config } from './config/index.js';
import apiRoutes from './routes/index.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // 프론트엔드가 다른 주소에서 돌아가도 API를 부를 수 있게 한다.
  app.use(
    cors({
      origin: config.corsOrigins.includes('*') ? true : config.corsOrigins
    })
  );

  app.use(express.json());

  // ---- API ----
  app.use('/api', apiRoutes);

  // /api로 시작하는데 위에서 처리되지 않은 요청은 404 JSON으로 답한다.
  app.use('/api', notFound);

  // ---- 정적 프론트엔드 (개발 편의용) ----
  // SERVE_FRONTEND=false 로 두면 백엔드는 API만 담당한다.
  if (config.serveFrontend) {
    app.use(express.static(config.paths.frontendDir));

    app.get('/', (req, res) => {
      res.sendFile(path.join(config.paths.frontendDir, 'index.html'));
    });
  }

  // ---- 오류 처리는 항상 맨 마지막 ----
  app.use(errorHandler);

  return app;
}
