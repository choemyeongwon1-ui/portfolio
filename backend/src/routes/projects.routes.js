import { Router } from 'express';
import { projectsController } from '../controllers/projects.controller.js';

const router = Router();

// GET /api/projects           — 전체 목록
// GET /api/projects?category=web — 분야별 목록
router.get('/', projectsController.list);

// GET /api/projects/:id — 프로젝트 하나
router.get('/:id', projectsController.detail);

export default router;
