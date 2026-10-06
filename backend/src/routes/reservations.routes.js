import { Router } from 'express';
import { reservationsController } from '../controllers/reservations.controller.js';

const router = Router();

// POST /api/reservations — 방문 예약 접수
router.post('/', reservationsController.create);

// GET /api/reservations/booked-times?date=YYYY-MM-DD — 이미 찬 시간 목록 (공개, 개인정보 없음)
router.get('/booked-times', reservationsController.bookedTimes);

export default router;
