// ==========================================
// 기술(스킬) 저장소 — DB 구현 (뼈대)
// ==========================================

import { getConnection } from './connection.js';

export const skillsRepository = {
  async find() {
    const db = await getConnection();

    // MongoDB 예시
    // const groups = await db.collection('skill_groups').find({}).toArray();
    // const tags   = await db.collection('skill_tags').distinct('name');
    // return { groups, tags };

    throw new Error('skillsRepository.find()를 구현하세요. (connection: ' + typeof db + ')');
  }
};
