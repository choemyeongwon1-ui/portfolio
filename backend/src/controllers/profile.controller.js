// ==========================================
// 프로필 컨트롤러
// ------------------------------------------
// HTTP 요청을 받아 서비스에 넘기고, 결과를 응답 형태로 감싼다.
// 업무 로직은 서비스에 두고, 여기에는 두지 않는다.
// ==========================================

import { profileService } from '../services/profile.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const profileController = {
  get: asyncHandler(async (req, res) => {
    const profile = await profileService.getProfile();
    res.json({ data: profile });
  })
};
