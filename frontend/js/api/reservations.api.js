// ==========================================
// 방문 예약 API 호출
// ==========================================

import { apiPost } from './client.js';

export const reservationsApi = {
  /** 예약 접수. @param {{date,time,name,email,purpose,agree}} payload */
  create(payload) {
    return apiPost('/reservations', payload);
  }
};
