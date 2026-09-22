// ==========================================
// 기술(스킬) 컨트롤러
// ==========================================

import { skillsService } from '../services/skills.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const skillsController = {
  get: asyncHandler(async (req, res) => {
    const skills = await skillsService.getSkills();
    res.json({ data: skills });
  })
};
