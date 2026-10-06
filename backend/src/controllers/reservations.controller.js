// ==========================================
// 방문 예약 컨트롤러
// ------------------------------------------
// HTTP 요청을 받아 서비스에 넘기고, 결과를 응답 형태로 감싼다.
// ==========================================

import { reservationsService } from '../services/reservations.service.js';
import { asyncHandler } from '../lib/asyncHandler.js';

export const reservationsController = {
  create: asyncHandler(async (req, res) => {
    const result = await reservationsService.create(req.body ?? {});
    res.status(201).json({ data: result });
  }),

  // GET /api/reservations/booked-times?date=YYYY-MM-DD
  bookedTimes: asyncHandler(async (req, res) => {
    const times = await reservationsService.getBookedTimes(req.query.date);
    res.json({ data: { times } });
  })
};
