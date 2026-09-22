// ==========================================
// 프로필 저장소 — JSON 파일 구현
// ------------------------------------------
// 여기서 정의한 함수 이름과 반환 형태가 "약속(인터페이스)"이다.
// DB 버전을 만들 때도 같은 이름, 같은 형태를 지키면
// 윗단(서비스·컨트롤러) 코드는 하나도 고치지 않아도 된다.
// ==========================================

import { readJson } from './jsonStore.js';

export const profileRepository = {
  /** 프로필 전체를 반환한다. @returns {Promise<object>} */
  async find() {
    return readJson('profile.json');
  }
};
