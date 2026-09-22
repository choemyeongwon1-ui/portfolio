// ==========================================
// 기술(스킬) 저장소 — JSON 파일 구현
// ==========================================

import { readJson } from './jsonStore.js';

export const skillsRepository = {
  /** { groups: [...], tags: [...] } 형태를 반환한다. */
  async find() {
    return readJson('skills.json');
  }
};
