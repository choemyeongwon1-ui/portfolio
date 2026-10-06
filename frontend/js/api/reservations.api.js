// ==========================================
// 방문 예약 API 호출
// ==========================================

import { apiPost, apiGet } from './client.js';

export const reservationsApi = {
  /** 예약 접수. @param {{date,time,name,email,purpose,agree}} payload */
  create(payload) {
    return apiPost('/reservations', payload);
  },

  /** 특정 날짜에 이미 찬 시간 목록. @param {string} date 'YYYY-MM-DD' @returns {Promise<string[]>} */
  async getBookedTimes(date) {
    const result = await apiGet('/reservations/booked-times', { date });
    return result?.times ?? [];
  }
};
