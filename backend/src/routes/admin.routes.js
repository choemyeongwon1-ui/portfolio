// ==========================================
// 관리자 라우트
// ------------------------------------------
// /login 만 누구나 호출할 수 있고,
// 그 아래는 모두 requireAuth를 지나야 한다.
// ==========================================

import { Router } from 'express';

import { adminController } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// 로그인은 토큰이 없는 상태에서 부르는 것이므로 보호하지 않는다.
router.post('/login', adminController.login);

// ---- 여기부터는 로그인한 사람만 ----
router.use(requireAuth);

router.get('/session', adminController.session);
router.post('/logout', adminController.logout);

router.get('/projects', adminController.list);
router.post('/projects', adminController.create);
router.get('/projects/:id', adminController.detail);
router.put('/projects/:id', adminController.update);
router.delete('/projects/:id', adminController.remove);

export default router;
