// ==========================================
// Vercel 빌드 스크립트
// ------------------------------------------
// frontend/ 를 .vercel-static/ 로 복사하면서 admin 관련 파일만 뺀다.
// GitHub Pages용 워크플로(.github/workflows/deploy-pages.yml)와 같은 일을
// 하지만, 셸 명령 한 줄(cp -r && rm -f ...) 대신 Node로 짠 이유가 있다.
//
// 셸 명령은 "지금 작업 폴더가 어디인지"에 따라 결과가 달라진다.
// Vercel 프로젝트 설정의 Root Directory가 무엇으로 되어 있든 상관없이
// 항상 같은 결과가 나오도록, 이 파일 자신의 실제 위치를 기준으로
// frontend/ 를 찾는다 — import.meta.url 은 "지금 작업 폴더"가 아니라
// "이 파일이 실제로 어디 있는지"를 알려주기 때문에 훨씬 안전하다.
// ==========================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.join(here, 'frontend');
const target = path.join(here, '.vercel-static');

if (!fs.existsSync(source)) {
  console.error(`frontend 폴더를 찾을 수 없습니다: ${source}`);
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });

// 관리자 페이지와 그 전용 코드는 공개 배포에 올리지 않는다.
// (이유: README.md의 "화면 — Vercel과 GitHub Pages" 절 참고)
const exclude = [
  'admin.html',
  'assets/css/admin.css',
  'js/admin',
  'js/api/admin.api.js',
  'js/lib/duplicate.js',
  'js/lib/josa.js'
];

for (const rel of exclude) {
  fs.rmSync(path.join(target, rel), { recursive: true, force: true });
}

console.log(`빌드 완료: ${source} → ${target} (admin 관련 ${exclude.length}개 항목 제외)`);
