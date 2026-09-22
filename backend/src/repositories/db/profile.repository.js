// ==========================================
// 프로필 저장소 — DB 구현 (뼈대)
// ------------------------------------------
// json/profile.repository.js 와 "같은 함수 이름, 같은 반환 형태"를 지킨다.
// 그래야 DATA_SOURCE만 바꿔도 나머지 코드가 그대로 동작한다.
// ==========================================

import { getConnection } from './connection.js';

export const profileRepository = {
  async find() {
    const db = await getConnection();

    // MongoDB 예시
    // return db.collection('profile').findOne({}, { projection: { _id: 0 } });

    // PostgreSQL 예시
    // const { rows } = await db.query('SELECT data FROM profile LIMIT 1');
    // return rows[0]?.data ?? null;

    throw new Error('profileRepository.find()를 구현하세요. (connection: ' + typeof db + ')');
  }
};
