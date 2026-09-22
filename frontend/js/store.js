// ==========================================
// 화면 상태 보관소 (store)
// ------------------------------------------
// 백엔드에서 받아온 데이터를 한곳에 모아 둔다.
// PDF 만들기처럼 "지금 화면에 안 보이는 내용까지" 필요한 기능은
// DOM을 뒤지지 말고 여기서 꺼내 쓴다.
// ==========================================

export const store = {
  profile: null,
  skills: null,
  categories: [],

  /** 필터와 상관없이 전체 프로젝트 (PDF 등에 사용) */
  allProjects: [],

  /** 지금 선택된 분야 */
  currentCategory: 'all'
};

export function setState(patch) {
  Object.assign(store, patch);
}
