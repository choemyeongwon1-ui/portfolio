// ==========================================
// DB 연결 자리 (아직 비어 있음)
// ------------------------------------------
// 실제 DB를 붙일 때 이 파일만 채우면 된다.
// 아래는 자주 쓰는 세 가지 예시다. 하나를 골라 주석을 풀고,
// 해당 패키지를 설치한 뒤(.env에 DATABASE_URL 작성) 사용한다.
// ==========================================

import { config } from '../../config/index.js';
import { AppError } from '../../lib/AppError.js';

let connection = null;

export async function getConnection() {
  if (connection) return connection;

  if (!config.database.url) {
    throw new AppError(
      'DATABASE_URL이 설정되지 않았습니다. backend/.env 파일을 확인하세요.',
      { status: 500, code: 'DB_NOT_CONFIGURED' }
    );
  }

  // ------------------------------------------------------------------
  // 예시 1) MongoDB   설치: npm i mongodb --workspace backend
  // ------------------------------------------------------------------
  // import { MongoClient } from 'mongodb';
  // const client = new MongoClient(config.database.url);
  // await client.connect();
  // connection = client.db(config.database.name);
  // return connection;

  // ------------------------------------------------------------------
  // 예시 2) PostgreSQL   설치: npm i pg --workspace backend
  // ------------------------------------------------------------------
  // import pg from 'pg';
  // connection = new pg.Pool({ connectionString: config.database.url });
  // return connection;

  // ------------------------------------------------------------------
  // 예시 3) MySQL   설치: npm i mysql2 --workspace backend
  // ------------------------------------------------------------------
  // import mysql from 'mysql2/promise';
  // connection = await mysql.createPool(config.database.url);
  // return connection;

  throw new AppError(
    'DB 연결이 아직 구현되지 않았습니다. backend/src/repositories/db/connection.js를 완성하세요.',
    { status: 501, code: 'DB_NOT_IMPLEMENTED' }
  );
}

export async function closeConnection() {
  if (!connection) return;
  // 드라이버에 맞게 close() 또는 end()를 호출한다.
  if (typeof connection.close === 'function') await connection.close();
  else if (typeof connection.end === 'function') await connection.end();
  connection = null;
}
