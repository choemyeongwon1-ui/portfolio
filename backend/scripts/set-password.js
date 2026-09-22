// ==========================================
// 관리자 비밀번호 설정 도구
// ------------------------------------------
// 실행:  npm run set-password
//
// 입력한 비밀번호를 해시로 바꿔 backend/.env 의 ADMIN_PASSWORD_HASH 에 저장한다.
// 비밀번호 원문은 어디에도 저장되지 않는다.
// ==========================================

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

import { hashPassword } from '../src/lib/password.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(here, '..', '.env');

/** 화면에 글자가 보이지 않게 입력받는다. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    // 입력 중 글자가 그대로 찍히지 않도록 가린다.
    const onData = (char) => {
      if (['\n', '\r', '\u0004'].includes(String(char))) {
        process.stdin.removeListener('data', onData);
        return;
      }
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(question + '*'.repeat(rl.line.length));
    };

    process.stdout.write(question);
    process.stdin.on('data', onData);

    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

/**
 * .env에서 key 줄을 새 값으로 바꾼다.
 * 같은 키가 여러 줄 있으면 모두 지우고 하나만 남긴다.
 * (줄 단위로 처리한다. 정규식으로 여러 줄을 다루면 실수하기 쉽다)
 */
function upsertEnv(contents, key, value) {
  const lines = contents.split(/\r?\n/);
  const kept = lines.filter((line) => !line.startsWith(`${key}=`));
  const hadKey = kept.length !== lines.length;

  // 원래 있던 자리에 넣고, 없던 키면 맨 뒤에 붙인다.
  if (hadKey) {
    const at = lines.findIndex((line) => line.startsWith(`${key}=`));
    const before = kept.slice(0, at);
    const after = kept.slice(at);
    return [...before, `${key}=${value}`, ...after].join('\n');
  }

  while (kept.length && kept.at(-1) === '') kept.pop();
  return [...kept, `${key}=${value}`, ''].join('\n');
}

async function main() {
  console.log('\n관리자 비밀번호를 설정합니다.\n');

  const password = await askHidden('새 비밀번호: ');

  if (password.length < 4) {
    console.error('\n비밀번호는 4자 이상이어야 합니다. 취소했습니다.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.warn(
      '\n주의: 8자 미만은 짧습니다. 관리자 페이지를 인터넷에 공개할 예정이라면\n' +
        '      더 긴 비밀번호를 권합니다. (이대로 진행합니다)'
    );
  }

  const again = await askHidden('한 번 더 입력: ');

  if (password !== again) {
    console.error('\n두 입력이 다릅니다. 취소했습니다.');
    process.exit(1);
  }

  const hash = hashPassword(password);
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
  let next = upsertEnv(current, 'ADMIN_PASSWORD_HASH', hash);

  // 평문 설정이 남아 있으면 지운다. 해시가 있으면 쓰이지 않기 때문이다.
  next = next
    .split(/\r?\n/)
    .filter((line) => !line.startsWith('ADMIN_PASSWORD='))
    .join('\n');

  fs.writeFileSync(envPath, next, 'utf-8');

  console.log('\n저장했습니다: backend/.env 의 ADMIN_PASSWORD_HASH');
  console.log('서버를 다시 시작하면 새 비밀번호가 적용됩니다.\n');
}

main().catch((error) => {
  console.error('\n설정 중 문제가 발생했습니다:', error.message);
  process.exit(1);
});
