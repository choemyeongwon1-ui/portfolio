// ==========================================
// 방문 예약 서비스
// ------------------------------------------
// 화면에서 보낸 값을 검증하고, 통과한 것만 저장소에 넘긴다.
// 화면 쪽 검증(reserve.js)과 규칙을 맞춰 두되, 여기서도 한 번 더 확인한다 —
// 화면 코드를 우회해서 API를 직접 두드리는 경우를 막기 위해서다.
// ==========================================

import { reservationsRepository } from '../repositories/index.js';
import { BadRequestError } from '../lib/AppError.js';

// 2026년 대한민국 공휴일(대체공휴일 포함). 해가 바뀌면 이 목록만 갱신하면 된다.
const HOLIDAYS_2026 = new Set([
  '2026-01-01', // 신정
  '2026-02-16', // 설날 연휴
  '2026-02-17', // 설날
  '2026-02-18', // 설날 연휴
  '2026-03-01', // 삼일절
  '2026-03-02', // 삼일절 대체공휴일
  '2026-05-05', // 어린이날
  '2026-05-24', // 부처님오신날
  '2026-05-25', // 부처님오신날 대체공휴일
  '2026-06-06', // 현충일
  '2026-08-15', // 광복절
  '2026-08-17', // 광복절 대체공휴일
  '2026-09-24', // 추석 연휴
  '2026-09-25', // 추석
  '2026-09-26', // 추석 연휴
  '2026-10-03', // 개천절
  '2026-10-05', // 개천절 대체공휴일
  '2026-10-09', // 한글날
  '2026-12-25' // 크리스마스
]);

const ALLOWED_TIMES = (() => {
  const times = [];
  for (let minutes = 13 * 60; minutes <= 18 * 60; minutes += 30) {
    const h = String(Math.floor(minutes / 60)).padStart(2, '0');
    const m = String(minutes % 60).padStart(2, '0');
    times.push(`${h}:${m}`);
  }
  return new Set(times);
})();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const LIMITS = { name: 40, email: 100, purpose: 1000 };

function parseLocalDate(dateStr) {
  // 'YYYY-MM-DD' 를 그 날짜의 현지 자정으로 해석한다 (UTC 변환으로 요일이 밀리지 않도록).
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function isWeekday(dateStr) {
  const day = parseLocalDate(dateStr).getDay();
  return day !== 0 && day !== 6; // 0=일요일, 6=토요일
}

// 당일 예약은 준비 시간이 필요해 받지 않는다 — 내일부터 가능 (frontend/js/reserve.js 와 맞춤).
function isAfterToday(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseLocalDate(dateStr) > today;
}

function validate(input) {
  const errors = [];
  const value = {};

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) errors.push({ field: 'name', message: '이름을 입력해 주세요.' });
  else if (name.length > LIMITS.name)
    errors.push({ field: 'name', message: `이름은 ${LIMITS.name}자 이하로 입력해 주세요.` });
  else value.name = name;

  const email = typeof input.email === 'string' ? input.email.trim() : '';
  if (!email) errors.push({ field: 'email', message: '답장받을 이메일을 입력해 주세요.' });
  else if (!EMAIL_PATTERN.test(email) || email.length > LIMITS.email)
    errors.push({ field: 'email', message: '이메일 형식이 올바르지 않습니다.' });
  else value.email = email;

  const purpose = typeof input.purpose === 'string' ? input.purpose.trim() : '';
  if (!purpose) errors.push({ field: 'purpose', message: '방문 목적을 입력해 주세요.' });
  else if (purpose.length > LIMITS.purpose)
    errors.push({ field: 'purpose', message: `방문 목적은 ${LIMITS.purpose}자 이하로 입력해 주세요.` });
  else value.purpose = purpose;

  const date = typeof input.date === 'string' ? input.date.trim() : '';
  if (!date || !DATE_PATTERN.test(date)) {
    errors.push({ field: 'date', message: '날짜를 선택해 주세요.' });
  } else if (!isAfterToday(date)) {
    errors.push({ field: 'date', message: '당일 예약은 받지 않습니다. 내일 이후 날짜를 선택해 주세요.' });
  } else if (!isWeekday(date)) {
    errors.push({ field: 'date', message: '평일만 예약할 수 있습니다.' });
  } else if (HOLIDAYS_2026.has(date)) {
    errors.push({ field: 'date', message: '공휴일은 예약할 수 없습니다.' });
  } else {
    value.date = date;
  }

  const time = typeof input.time === 'string' ? input.time.trim() : '';
  if (!time || !ALLOWED_TIMES.has(time)) {
    errors.push({ field: 'time', message: '13:00~18:00 사이, 30분 단위로 선택해 주세요.' });
  } else {
    value.time = time;
  }

  if (input.agree !== true) {
    errors.push({ field: 'agree', message: '정보 제공에 동의해야 예약할 수 있습니다.' });
  }

  if (errors.length > 0) {
    throw new BadRequestError('입력 내용을 다시 확인해 주세요.', errors);
  }

  return value;
}

export const reservationsService = {
  async create(input) {
    const value = validate(input);

    const reservation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...value,
      createdAt: new Date().toISOString()
    };

    await reservationsRepository.insert(reservation);

    // 이메일 본문·답장 내용 등은 아직 처리하지 않는다 — 우선 저장만 한다.
    return { id: reservation.id, createdAt: reservation.createdAt };
  }
};
