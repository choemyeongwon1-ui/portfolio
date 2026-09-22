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

function upsertEnv(contents, key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');

  if (pattern.test(contents)) {
    return contents.replace(pattern, line);
  }

  const separator = contents.length && !contents.endsWith('\n') ? '\n' : '';
  return `${contents}${separator}${line}\n`;
}

async function main() {
  console.log('\n관리자 비밀번호를 설정합니다.\n');

  const password = await askHidden('새 비밀번호: ');

  if (password.length < 8) {
    console.error('\n비밀번호는 8자 이상이어야 합니다. 취소했습니다.');
    process.exit(1);
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
  next = next.replace(/^ADMIN_PASSWORD=.*$\n?/m, '');

  fs.writeFileSync(envPath, next, 'utf-8');

  console.log('\n저장했습니다: backend/.env 의 ADMIN_PASSWORD_HASH');
  console.log('서버를 다시 시작하면 새 비밀번호가 적용됩니다.\n');
}

main().catch((error) => {
  console.error('\n설정 중 문제가 발생했습니다:', error.message);
  process.exit(1);
});
