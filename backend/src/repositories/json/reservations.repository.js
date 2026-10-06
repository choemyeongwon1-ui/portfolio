// ==========================================
// 방문 예약 저장소 — JSON 파일 구현
// ------------------------------------------
// 여기서 정의한 함수 이름과 반환 형태가 "약속(인터페이스)"이다.
// DB 버전을 만들 때도 같은 이름, 같은 형태를 지키면
// 윗단(서비스·컨트롤러) 코드는 하나도 고치지 않아도 된다.
//
// insert·updateStatus는 mutateJson(읽기까지 줄을 세우는 버전)을 쓴다 —
// 거의 동시에 들어온 요청끼리 서로의 저장 내용을 덮어쓰지 않도록 하기 위해서다.
// ==========================================

import { readJson, mutateJson } from './jsonStore.js';
import { BadRequestError } from '../../lib/AppError.js';

const FILE = 'reservations.json';

// 이 상태인 예약은 그 날짜·시간을 "차지하지 않은 것"으로 본다 — 취소되면 자리가 다시 열린다.
const RELEASES_SLOT = new Set(['취소']);

function occupiesSlot(reservation) {
  return !RELEASES_SLOT.has(reservation.status);
}

export const reservationsRepository = {
  /** 전체 예약 목록을 반환한다 (최신순). @returns {Promise<object[]>} */
  async list() {
    const reservations = await readJson(FILE).catch(() => []);
    return reservations.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  /**
   * 특정 날짜에 이미 차 있는(취소되지 않은) 시간 목록을 반환한다.
   * @param {string} date 'YYYY-MM-DD'
   * @returns {Promise<string[]>}
   */
  async listBookedTimes(date) {
    const reservations = await readJson(FILE).catch(() => []);
    const times = reservations
      .filter((r) => r.date === date && occupiesSlot(r))
      .map((r) => r.time);
    return [...new Set(times)].sort();
  },

  /**
   * 예약 한 건을 추가한다. 같은 날짜·시간이 이미 차 있으면(취소 제외) 저장하지 않고 오류를 던진다.
   * 이 확인과 저장은 한 덩어리로 묶여 있어서, 거의 동시에 들어온 요청끼리도 안전하다.
   * @returns {Promise<object>} 추가된 예약
   */
  async insert(reservation) {
    return mutateJson(FILE, (current) => {
      const taken = current.some(
        (r) => r.date === reservation.date && r.time === reservation.time && occupiesSlot(r)
      );

      if (taken) {
        throw new BadRequestError('이미 예약된 시간입니다. 다른 시간을 선택해 주세요.', [
          { field: 'time', message: '이미 예약된 시간입니다. 다른 시간을 선택해 주세요.' }
        ]);
      }

      return { value: [...current, reservation], result: reservation };
    });
  },

  /** 예약의 처리 상태를 바꾼다. 없으면 null. @returns {Promise<object|null>} */
  async updateStatus(id, status) {
    return mutateJson(FILE, (current) => {
      const index = current.findIndex((item) => item.id === id);

      if (index === -1) {
        return { value: current, result: null };
      }

      const updated = { ...current[index], status, updatedAt: new Date().toISOString() };
      const next = current.slice();
      next[index] = updated;

      return { value: next, result: updated };
    });
  }
};
