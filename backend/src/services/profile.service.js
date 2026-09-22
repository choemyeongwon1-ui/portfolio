// ==========================================
// 프로필 서비스
// ------------------------------------------
// 저장소에서 받은 원자료를 화면이 쓰기 좋은 형태로 다듬는 곳.
// 외부 API(예: GitHub 프로필)를 함께 합칠 일이 생기면 여기에 붙인다.
// ==========================================

import { profileRepository } from '../repositories/index.js';
import { NotFoundError } from '../lib/AppError.js';

export const profileService = {
  async getProfile() {
    const profile = await profileRepository.find();

    if (!profile) {
      throw new NotFoundError('프로필 정보를 찾을 수 없습니다.');
    }

    return profile;
  }
};
