// ==========================================
// 한국어 조사 붙이기
// ------------------------------------------
// "분야을(를)" 처럼 어색하게 나오지 않도록,
// 앞 글자에 받침이 있는지 보고 조사를 고른다.
//   제목(ㄱ 받침) → 제목을
//   분야(받침 없음) → 분야를
// ==========================================

const PAIRS = {
  '을/를': ['을', '를'],
  '이/가': ['이', '가'],
  '은/는': ['은', '는'],
  '와/과': ['과', '와']
};

/** 마지막 글자에 받침이 있는지 확인한다. */
function hasFinalConsonant(word) {
  const last = String(word ?? '').trim().at(-1);
  if (!last) return false;

  const code = last.charCodeAt(0);
  // 한글 음절 영역이 아니면 받침이 없는 것으로 본다.
  if (code < 0xac00 || code > 0xd7a3) return false;

  return (code - 0xac00) % 28 !== 0;
}

/**
 * 단어에 알맞은 조사를 붙여 돌려준다.
 * @param {string} word
 * @param {'을/를'|'이/가'|'은/는'|'와/과'} pair
 */
export function withJosa(word, pair = '을/를') {
  const [withBatchim, withoutBatchim] = PAIRS[pair] ?? PAIRS['을/를'];
  return `${word}${hasFinalConsonant(word) ? withBatchim : withoutBatchim}`;
}
