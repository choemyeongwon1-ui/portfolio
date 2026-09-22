// ==========================================
// API 라우트 모음
// ------------------------------------------
// 새 기능(예: 방명록, 조회수)을 추가할 때는
// 1) routes/방명록.routes.js 를 만들고
// 2) 여기에 router.use('/guestbook', guestbookRoutes) 한 줄을 더하면 된다.
// ==========================================

import { Router } from 'express';

import profileRoutes from './profile.routes.js';
import skillsRoutes from './skills.routes.js';
import projectsRoutes from './projects.routes.js';
import { projectsController } from '../controllers/projects.controller.js';
import { config } from '../config/index.js';

const router = Router();

// 서버가 살아 있는지 확인하는 용도
router.get('/health', (req, res) => {
  res.json({
    data: {
      status: 'ok',
      env: config.env,
      dataSource: config.dataSource,
      time: new Date().toISOString()
    }
  });
});

router.get('/categories', projectsController.categories);

router.use('/profile', profileRoutes);
router.use('/skills', skillsRoutes);
router.use('/projects', projectsRoutes);

export default router;
