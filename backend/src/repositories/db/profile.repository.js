// ==========================================
// 프로필 저장소 — Supabase 구현
// ------------------------------------------
// json/profile.repository.js 와 "같은 함수 이름, 같은 반환 형태"를 지킨다.
// 그래야 DATA_SOURCE만 바꿔도 나머지 코드가 그대로 동작한다.
// ==========================================

import { getConnection } from './connection.js';
import { AppError } from '../../lib/AppError.js';

export const profileRepository = {
  async find() {
    const supabase = getConnection();
    const { data, error } = await supabase
      .from('profile')
      .select('data')
      .eq('id', 1)
      .maybeSingle();

    if (error) throw new AppError(error.message, { status: 500, code: 'DB_ERROR', cause: error });
    if (!data) {
      throw new AppError('profile 테이블에 데이터가 없습니다. backend/supabase/schema.sql을 실행했는지 확인하세요.', {
        status: 500,
        code: 'DB_EMPTY'
      });
    }

    return data.data;
  }
};
