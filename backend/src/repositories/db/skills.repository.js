// ==========================================
// 기술(스킬) 저장소 — Supabase 구현
// ==========================================

import { getConnection } from './connection.js';
import { AppError } from '../../lib/AppError.js';

export const skillsRepository = {
  async find() {
    const supabase = getConnection();
    const { data, error } = await supabase
      .from('skills')
      .select('data')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw new AppError(error.message, { status: 500, code: 'DB_ERROR', cause: error });
    if (!data) {
      throw new AppError('skills 테이블에 데이터가 없습니다. backend/supabase/schema.sql을 실행했는지 확인하세요.', {
        status: 500,
        code: 'DB_EMPTY'
      });
    }

    return data.data;
  }
};
