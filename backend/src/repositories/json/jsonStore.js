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
