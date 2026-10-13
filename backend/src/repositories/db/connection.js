// ==========================================
// DB 연결 — Supabase
// ------------------------------------------
// service_role 키로 연결한다 (RLS를 우회하는 서버 전용 키).
// 이 파일은 서버(Render)에서만 실행되고 브라우저로 나가지 않으므로 안전하다.
// ==========================================

import { createClient } from '@supabase/supabase-js';
import { config } from '../../config/index.js';
import { AppError } from '../../lib/AppError.js';

let client = null;

export function getConnection() {
  if (client) return client;

  if (!config.supabase.url || !config.supabase.serviceKey) {
    throw new AppError(
      'SUPABASE_URL / SUPABASE_SERVICE_KEY가 설정되지 않았습니다. backend/.env 파일을 확인하세요.',
      { status: 500, code: 'DB_NOT_CONFIGURED' }
    );
  }

  client = createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: { persistSession: false }
  });

  return client;
}

export async function closeConnection() {
  client = null;
}
