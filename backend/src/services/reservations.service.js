// ==========================================
// 방문 예약 서비스
// ------------------------------------------
// 화면에서 보낸 값을 검증하고, 통과한 것만 저장소에 넘긴다.
// 화면 쪽 검증(reserve.js)과 규칙을 맞춰 두되, 여기서도 한 번 더 확인한다 —
// 화면 코드를 우회해서 API를 직접 두드리는 경우를 막기 위해서다.
// ==========================================

import { createHash } from 'node:crypto';

import { reservationsRepository } from '../repositories/index.js';
import { BadRequestError, NotFoundError } from '../lib/AppError.js';
import { config } from '../config/index.js';

// 처리 상태 4가지. 관리자 페이지의 버튼도 이 목록을 그대로 따른다.
//   접수      — 방문자가 막 신청한 상태 (기본값)
//   확정      — 운영자가 그 날짜·시간으로 승인함
//   변경 요청 — 미팅은 하고 싶으나 다른 시간을 요청함
//   취소      — 이 방문을 받지 않기로 함
export const RESERVATION_STATUSES = ['접수', '확정', '변경 요청', '취소'];

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

// 예약 번호 — 이름·이메일·방문 날짜·시간으로 만든다.
// 같은 사람이어도 희망 시간이 다르면 번호가 달라지고, 같은 사람이 같은 시간을
// 두 번 신청하면 번호가 같아진다 (중복 신청을 알아보기 쉽도록 만든 의도된 동작).
function makeReservationCode({ name, email, date, time }) {
  const hash = createHash('sha256').update(`${name}|${email}|${date}T${time}`).digest('hex');
  return hash.slice(0, 6).toUpperCase();
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

// Formspree로 같은 내용을 한 번 더 보내 이메일 알림을 받는다.
// 실패해도 예약 저장 자체는 이미 끝난 뒤이므로, 여기서는 막지 않고 로그만 남긴다.
async function notifyByEmail(reservation) {
  if (!config.formspreeEndpoint) return;

  try {
    const res = await fetch(config.formspreeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: reservation.email, // Formspree가 이 필드를 답장(reply-to) 주소로 쓴다.
        name: reservation.name,
        date: reservation.date,
        time: reservation.time,
        purpose: reservation.purpose,
        _subject: `[방문 예약] ${reservation.name} · ${reservation.date} ${reservation.time}`
      })
    });

    if (!res.ok) {
      console.error('[reservations] Formspree 알림 실패:', res.status, await res.text().catch(() => ''));
    }
  } catch (error) {
    console.error('[reservations] Formspree 알림 중 오류:', error);
  }
}

export const reservationsService = {
  async create(input) {
    const value = validate(input);

    const reservation = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      code: makeReservationCode(value),
      status: RESERVATION_STATUSES[0], // '접수'
      ...value,
      createdAt: new Date().toISOString()
    };

    await reservationsRepository.insert(reservation);
    await notifyByEmail(reservation);

    return { id: reservation.id, createdAt: reservation.createdAt };
  },

  // ---- 여기부터는 관리자 페이지 전용 ----

  /** 전체 예약 목록 (관리자용) */
  async list() {
    return reservationsRepository.list();
  },

  /** 예약 하나의 처리 상태를 바꾼다. */
  async updateStatus(id, status) {
    if (!RESERVATION_STATUSES.includes(status)) {
      throw new BadRequestError(
        `처리 상태는 다음 중 하나여야 합니다: ${RESERVATION_STATUSES.join(', ')}`
      );
    }

    const updated = await reservationsRepository.updateStatus(id, status);
    if (!updated) {
      throw new NotFoundError('예약을 찾을 수 없습니다.');
    }

    return updated;
  }
};
