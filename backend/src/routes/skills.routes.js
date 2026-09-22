import { Router } from 'express';
import { skillsController } from '../controllers/skills.controller.js';

const router = Router();

// GET /api/skills — 기술 그룹과 관심 키워드
router.get('/', skillsController.get);

export default router;
