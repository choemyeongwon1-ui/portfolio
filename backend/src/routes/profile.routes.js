import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';

const router = Router();

// GET /api/profile — 이름, 소개, 연락처 등 기본 정보
router.get('/', profileController.get);

export default router;
