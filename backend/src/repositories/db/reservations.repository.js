// ==========================================
// 방문 예약 저장소 — Supabase 구현
// ------------------------------------------
// json/reservations.repository.js 와 "같은 함수 이름, 같은 반환 형태"를 지킨다.
//
// JSON 버전은 mutateJson(파일 잠금)으로 "이미 예약된 시간" 중복을 막았다.
// DB 버전은 (date, time) 부분 유니크 인덱스(backend/supabase/schema.sql,
// status <> '취소' 조건)로 같은 효과를 내고, 그 제약 위반(23505)을
// 같은 BadRequestError로 바꿔서 서비스 계층은 손대지 않아도 되게 한다.
// ==========================================

import { getConnection } from './connection.js';
import { AppError, BadRequestError } from '../../lib/AppError.js';

const RELEASES_SLOT = new Set(['취소']);

function occupiesSlot(reservation) {
  return !RELEASES_SLOT.has(reservation.status);
}

function toDomain(row) {
  return {
    id: row.id,
    code: row.code,
    status: row.status,
    name: row.name,
    email: row.email,
    purpose: row.purpose,
    date: row.date,
    time: row.time,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined
  };
}

function fail(error) {
  throw new AppError(error.message, { status: 500, code: 'DB_ERROR', cause: error });
}

export const reservationsRepository = {
  async list() {
    const supabase = getConnection();
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) fail(error);
    return data.map(toDomain);
  },

  async listBookedTimes(date) {
    const supabase = getConnection();
    const { data, error } = await supabase.from('reservations').select('time, status').eq('date', date);

    if (error) fail(error);

    const times = data.filter(occupiesSlot).map((r) => r.time);
    return [...new Set(times)].sort();
  },

  async insert(reservation) {
    const supabase = getConnection();
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        id: reservation.id,
        code: reservation.code,
        status: reservation.status,
        name: reservation.name,
        email: reservation.email,
        purpose: reservation.purpose,
        date: reservation.date,
        time: reservation.time,
        created_at: reservation.createdAt
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new BadRequestError('이미 예약된 시간입니다. 다른 시간을 선택해 주세요.', [
          { field: 'time', message: '이미 예약된 시간입니다. 다른 시간을 선택해 주세요.' }
        ]);
      }
      fail(error);
    }

    return toDomain(data);
  },

  async updateStatus(id, status) {
    const supabase = getConnection();
    const { data, error } = await supabase
      .from('reservations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) fail(error);
    return data ? toDomain(data) : null;
  }
};
