// ==========================================
// 설정 (config)
// ------------------------------------------
// 환경변수를 한곳에서 읽어 설정 객체로 만든다.
// 코드 어디에서도 process.env를 직접 읽지 않는다.
// 새 설정이 필요하면 여기에만 추가하면 된다.
// ==========================================

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));

// backend/src/config → backend/src → backend → portfolio-site
const backendRoot = path.resolve(here, '..', '..');
const projectRoot = path.resolve(backendRoot, '..');

// .env는 항상 backend 폴더에서 찾는다.
// 'dotenv/config'를 그냥 부르면 "명령을 실행한 위치" 기준으로 찾기 때문에,
// 루트에서 `node backend/src/server.js` 로 켜면 설정을 놓친다.
dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });

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

  // 관리자 로그인 설정.
  // 비밀번호는 여기(서버)에서만 다루며, 프론트엔드로 절대 내보내지 않는다.
  admin: {
    // 권장: `npm run set-password` 로 만든 해시를 .env의 ADMIN_PASSWORD_HASH에 넣는다.
    passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
    // 해시가 없을 때만 쓰는 임시 방편. 평문이므로 개발 중에만 사용한다.
    passwordPlain: process.env.ADMIN_PASSWORD || '',
    // 로그인 유지 시간 (분)
    sessionTtlMs: (Number(process.env.ADMIN_SESSION_MINUTES) || 120) * 60 * 1000,

    // 관리자 기능(로그인·글쓰기)을 이 서버에서 켤지 말지.
    // 기본은 켜짐(로컬 개발용). 공개 배포판(Vercel)에서는 ENABLE_ADMIN=false 로 끈다.
    //
    // 왜 끄는가: 여기서 쓰는 저장 방식은 파일에 직접 쓰는 방식이라,
    // 서버가 요청마다 새로 뜨는 서버리스 환경(Vercel)에서는 "저장했다"고 나와도
    // 그 내용이 유지된다는 보장이 없다. 로그인 유지 상태도 마찬가지다.
    // 그래서 실제 글쓰기·수정은 내 컴퓨터(npm run dev)에서만 하고,
    // 저장한 내용을 git으로 올리면 공개 사이트에는 그 커밋 기준으로 반영되는 방식을 쓴다.
    enabled: toBool(process.env.ENABLE_ADMIN, true)
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
