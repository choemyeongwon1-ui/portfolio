// ==========================================
// 중복 프로젝트 찾기
// ------------------------------------------
// 규칙은 두 가지뿐이다. 단순하게 유지한다.
//   1) 제목이 사실상 같다  — 띄어쓰기·대소문자·문장부호를 무시하고 비교
//   2) 링크가 같다         — http(s)·www·끝 슬래시를 무시하고 비교
//
// 비슷한 정도를 점수로 재는 방식(편집거리 등)은 쓰지 않는다.
// 기준이 눈에 보이지 않으면 왜 중복으로 걸렸는지 설명하기 어렵기 때문이다.
// ==========================================

/** 제목에서 띄어쓰기·문장부호를 걷어내고 소문자로 만든다. */
export function normalizeTitle(title) {
  return String(title ?? '')
    .toLowerCase()
    .replace(/[\s\p{P}\p{S}]/gu, '');
}

/** 주소에서 http(s)://, www., 끝 슬래시를 걷어낸다. */
export function normalizeUrl(url) {
  return String(url ?? '')
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

/**
 * 두 프로젝트가 같은 것으로 보이는지 확인한다.
 * @returns {'제목'|'링크'|null} 겹친 이유, 아니면 null
 */
export function sameReason(a, b) {
  const titleA = normalizeTitle(a?.title);
  if (titleA && titleA === normalizeTitle(b?.title)) return '제목';

  const urlA = normalizeUrl(a?.link?.url);
  if (urlA && urlA === normalizeUrl(b?.link?.url)) return '링크';

  return null;
}

/**
 * 목록에서 이 프로젝트와 겹치는 것을 찾는다.
 * @param {object} project 확인할 프로젝트
 * @param {object[]} list 기존 목록
 * @param {string} [excludeId] 수정 중인 자기 자신은 제외
 * @returns {{ project: object, reason: string } | null}
 */
export function findDuplicate(project, list, excludeId) {
  for (const other of list ?? []) {
    if (other.id === excludeId) continue;

    const reason = sameReason(project, other);
    if (reason) return { project: other, reason };
  }

  return null;
}

/**
 * 이미 저장된 목록 안에 겹치는 묶음이 있는지 찾는다.
 * (관리자 화면 위쪽에 "정리하세요" 안내를 띄우는 데 쓴다)
 * @returns {{ reason: string, items: object[] }[]}
 */
export function findDuplicateGroups(list) {
  const groups = [];
  const used = new Set();

  for (const project of list ?? []) {
    if (used.has(project.id)) continue;

    const matches = (list ?? []).filter(
      (other) => other.id !== project.id && !used.has(other.id) && sameReason(project, other)
    );

    if (!matches.length) continue;

    const items = [project, ...matches];
    items.forEach((item) => used.add(item.id));

    groups.push({ reason: sameReason(project, matches[0]), items });
  }

  return groups;
}
