import { Router } from 'express';
import { reservationsController } from '../controllers/reservations.controller.js';

const router = Router();

// POST /api/reservations — 방문 예약 접수
router.post('/', reservationsController.create);

export default router;
