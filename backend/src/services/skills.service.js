// ==========================================
// 기술(스킬) 서비스
// ==========================================

import { skillsRepository } from '../repositories/index.js';
import { NotFoundError } from '../lib/AppError.js';

export const skillsService = {
  async getSkills() {
    const skills = await skillsRepository.find();

    if (!skills) {
      throw new NotFoundError('기술 정보를 찾을 수 없습니다.');
    }

    // 값이 비어 있어도 화면이 깨지지 않도록 기본 형태를 보장한다.
    return {
      groups: skills.groups ?? [],
      tags: skills.tags ?? []
    };
  }
};
