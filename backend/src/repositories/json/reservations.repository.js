// ==========================================
// 방문 예약 저장소 — JSON 파일 구현
// ------------------------------------------
// 여기서 정의한 함수 이름과 반환 형태가 "약속(인터페이스)"이다.
// DB 버전을 만들 때도 같은 이름, 같은 형태를 지키면
// 윗단(서비스·컨트롤러) 코드는 하나도 고치지 않아도 된다.
// ==========================================

import { readJson, writeJson } from './jsonStore.js';

const FILE = 'reservations.json';

export const reservationsRepository = {
  /** 전체 예약 목록을 반환한다 (최신순). @returns {Promise<object[]>} */
  async list() {
    const reservations = await readJson(FILE).catch(() => []);
    return reservations.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /** 예약 한 건을 추가한다. @returns {Promise<object>} 추가된 예약 */
  async insert(reservation) {
    const reservations = await readJson(FILE).catch(() => []);
    reservations.push(reservation);
    await writeJson(FILE, reservations);
    return reservation;
  },

  /** 예약의 처리 상태를 바꾼다. 없으면 null. @returns {Promise<object|null>} */
  async updateStatus(id, status) {
    const reservations = await readJson(FILE).catch(() => []);
    const index = reservations.findIndex((item) => item.id === id);

    if (index === -1) return null;

    reservations[index] = {
      ...reservations[index],
      status,
      updatedAt: new Date().toISOString()
    };
    await writeJson(FILE, reservations);
    return reservations[index];
  }
};
