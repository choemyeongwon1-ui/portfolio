// ==========================================
// 비밀번호 저장과 확인
// ------------------------------------------
// 비밀번호를 그대로 저장하지 않고 scrypt 해시로 바꿔서 보관한다.
// 해시는 되돌릴 수 없기 때문에, .env 파일을 누가 보더라도
// 원래 비밀번호가 무엇인지 알 수 없다.
//
// 비교할 때는 timingSafeEqual을 쓴다. 일반 === 비교는 앞글자부터 순서대로
// 확인하다가 틀리면 바로 멈추기 때문에, 걸린 시간을 재서 비밀번호를
// 한 글자씩 알아내는 공격이 가능하다. timingSafeEqual은 항상 같은 시간이 걸린다.
// ==========================================

import crypto from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1 };

/** 비밀번호를 "salt:해시" 형태의 문자열로 만든다. */
export function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `${salt}:${derived.toString('hex')}`;
}

/** 입력한 비밀번호가 저장된 해시와 맞는지 확인한다. */
export function verifyPassword(plain, stored) {
  if (!plain || !stored) return false;

  const [salt, expectedHex] = String(stored).split(':');
  if (!salt || !expectedHex) return false;

  let expected;
  try {
    expected = Buffer.from(expectedHex, 'hex');
  } catch {
    return false;
  }

  if (expected.length !== KEY_LENGTH) return false;

  const actual = crypto.scryptSync(plain, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return crypto.timingSafeEqual(actual, expected);
}
