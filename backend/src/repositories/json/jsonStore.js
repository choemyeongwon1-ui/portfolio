// ==========================================
// JSON 파일 읽기 도우미
// ------------------------------------------
// backend/src/data 폴더의 JSON 파일을 읽어 온다.
// 개발 중에는 파일을 고치면 바로 반영되도록 캐시를 끄고,
// 운영 환경에서는 한 번 읽은 내용을 재사용한다.
// ==========================================

import fs from 'node:fs/promises';
import path from 'node:path';

import { config } from '../../config/index.js';
import { AppError } from '../../lib/AppError.js';

const cache = new Map();
const useCache = config.env === 'production';

export async function readJson(fileName) {
  if (useCache && cache.has(fileName)) {
    return structuredClone(cache.get(fileName));
  }

  const filePath = path.join(config.paths.dataDir, fileName);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw);

    if (useCache) cache.set(fileName, parsed);

    // 호출한 쪽에서 내용을 바꿔도 원본이 오염되지 않도록 복사본을 준다.
    return structuredClone(parsed);
  } catch (error) {
    throw new AppError(`데이터 파일을 읽지 못했습니다: ${fileName}`, {
      status: 500,
      code: 'DATA_READ_FAILED',
      cause: error
    });
  }
}

// 데이터 파일을 고친 뒤 서버를 재시작하지 않고 반영하고 싶을 때 쓴다.
export function clearCache() {
  cache.clear();
}

// 같은 파일에 동시에 쓰지 않도록 차례를 세운다.
// (관리자가 저장 버튼을 빠르게 두 번 눌러도 내용이 섞이지 않는다)
let writeQueue = Promise.resolve();

export function writeJson(fileName, value) {
  const task = writeQueue.then(async () => {
    const filePath = path.join(config.paths.dataDir, fileName);
    // 임시 파일에 먼저 쓰고 이름을 바꾼다.
    // 쓰다가 중단되어도 원본이 반쯤 망가지는 일이 없다.
    const tempPath = `${filePath}.tmp`;

    try {
      await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
      await fs.rename(tempPath, filePath);
      cache.delete(fileName);
    } catch (error) {
      await fs.rm(tempPath, { force: true }).catch(() => {});
      throw new AppError(`데이터 파일을 저장하지 못했습니다: ${fileName}`, {
        status: 500,
        code: 'DATA_WRITE_FAILED',
        cause: error
      });
    }
  });

  // 앞선 작업이 실패해도 다음 저장이 막히지 않게 한다.
  writeQueue = task.catch(() => {});
  return task;
}

/**
 * "읽고 → 확인하고 → 쓰기"를 한 덩어리로 묶어서, 그 사이에 다른 읽기·쓰기가
 * 끼어들지 못하게 한다 (writeJson과 같은 줄을 선다).
 *
 * writeJson만 썼을 때의 문제: 호출한 쪽에서 readJson으로 먼저 읽고, 그 결과를
 * 바탕으로 새 값을 만들어 writeJson으로 쓴다. 그런데 "읽기"는 줄을 서지 않기
 * 때문에, 거의 동시에 들어온 두 요청이 똑같은 옛 상태를 읽고 각자 수정한 뒤
 * 차례로 저장하면, 나중에 저장된 쪽이 먼저 저장된 변경사항을 덮어써 버린다
 * (예: 예약 두 건이 동시에 들어오면 하나가 조용히 사라짐).
 *
 * mutateJson은 "읽기"까지 줄 세우기 안에 넣어서 이 문제를 막는다.
 *
 * @param {string} fileName
 * @param {(current: any) => { value: any, result: any } | Promise<{ value: any, result: any }>} mutator
 *   현재 값을 받아 { value: 저장할 새 값, result: 호출한 쪽에 돌려줄 값 } 을 반환한다.
 *   저장할 필요가 없으면(예: 검증 실패) mutator 안에서 바로 오류를 throw하면 된다 —
 *   그러면 파일은 그대로 두고 오류만 호출한 쪽으로 전달된다.
 * @returns {Promise<any>} mutator가 돌려준 result
 */
export function mutateJson(fileName, mutator) {
  const task = writeQueue.then(async () => {
    const filePath = path.join(config.paths.dataDir, fileName);

    let current;
    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      current = JSON.parse(raw);
    } catch {
      current = [];
    }

    const { value, result } = await mutator(current);

    const tempPath = `${filePath}.tmp`;
    try {
      await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
      await fs.rename(tempPath, filePath);
      cache.delete(fileName);
    } catch (error) {
      await fs.rm(tempPath, { force: true }).catch(() => {});
      throw new AppError(`데이터 파일을 저장하지 못했습니다: ${fileName}`, {
        status: 500,
        code: 'DATA_WRITE_FAILED',
        cause: error
      });
    }

    return result;
  });

  writeQueue = task.catch(() => {});
  return task;
}
