// ==========================================
// 방문 예약 저장소 — DB 구현 (뼈대)
// ------------------------------------------
// json/reservations.repository.js 와 "같은 함수 이름, 같은 반환 형태"를 지킨다.
// 그래야 DATA_SOURCE만 바꿔도 나머지 코드가 그대로 동작한다.
// ==========================================

import { getConnection } from './connection.js';

export const reservationsRepository = {
  async list() {
    const db = await getConnection();
    throw new Error('reservationsRepository.list()를 구현하세요. (connection: ' + typeof db + ')');
  },

  async insert(reservation) {
    const db = await getConnection();
    throw new Error(
      'reservationsRepository.insert()를 구현하세요. (connection: ' + typeof db + ')'
    );
  }
};
