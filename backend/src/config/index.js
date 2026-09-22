// ==========================================
// 설정 (config)
// ------------------------------------------
// 환경변수를 한곳에서 읽어 설정 객체로 만든다.
// 코드 어디에서도 process.env를 직접 읽지 않는다.
// 새 설정이 필요하면 여기에만 추가하면 된다.
// ==========================================

import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// backend/src/config → backend/src → backend → portfolio-site
const backendRoot = path.resolve(here, '..', '..');
const projectRoot = path.resolve(backendRoot, '..');

function toBool(value, fallback) {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,

  // 데이터를 어디서 읽을지 고르는 스위치.
  // 'json'  : backend/src/data/*.json 파일에서 읽는다 (현재 기본값)
  // 'db'    : 데이터베이스에서 읽는다 (repositories/db 구현 필요)
  dataSource: process.env.DATA_SOURCE || 'json',

  // DB를 붙일 때 사용할 접속 정보. 지금은 비어 있어도 된다.
  database: {
    url: process.env.DATABASE_URL || '',
    name: process.env.DATABASE_NAME || 'portfolio'
  },

  // 프론트엔드에서 API를 호출할 수 있게 허용할 주소 목록.
  // 쉼표로 구분해서 여러 개를 넣을 수 있다. '*'면 전부 허용.
  corsOrigins: (process.env.CORS_ORIGINS || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),

  // 개발 중에는 백엔드가 프론트엔드 정적 파일까지 같이 내보낸다.
  // 나중에 프론트엔드를 Vercel 같은 곳에 따로 올리면 false로 바꾸면 된다.
  serveFrontend: toBool(process.env.SERVE_FRONTEND, true),

  paths: {
    projectRoot,
    backendRoot,
    dataDir: path.join(backendRoot, 'src', 'data'),
    frontendDir: path.join(projectRoot, 'frontend')
  }
};
