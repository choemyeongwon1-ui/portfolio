// ==========================================
// 저장소 선택 지점 (Repository Factory)
// ------------------------------------------
// ★ 나중에 DB를 붙일 때 고치는 곳은 사실상 이 파일 하나다.
//
//   .env 에서  DATA_SOURCE=json  →  JSON 파일에서 읽는다 (기본값)
//   .env 에서  DATA_SOURCE=db    →  데이터베이스에서 읽는다
//
// 서비스와 컨트롤러는 아래에서 내보낸 객체만 쓰기 때문에,
// 저장소 구현이 바뀌어도 윗단 코드는 영향을 받지 않는다.
// ==========================================

import { config } from '../config/index.js';

import { profileRepository as jsonProfile } from './json/profile.repository.js';
import { skillsRepository as jsonSkills } from './json/skills.repository.js';
import { projectsRepository as jsonProjects } from './json/projects.repository.js';

import { profileRepository as dbProfile } from './db/profile.repository.js';
import { skillsRepository as dbSkills } from './db/skills.repository.js';
import { projectsRepository as dbProjects } from './db/projects.repository.js';

const implementations = {
  json: {
    profile: jsonProfile,
    skills: jsonSkills,
    projects: jsonProjects
  },
  db: {
    profile: dbProfile,
    skills: dbSkills,
    projects: dbProjects
  }
};

const selected = implementations[config.dataSource];

if (!selected) {
  throw new Error(
    `DATA_SOURCE 값이 올바르지 않습니다: "${config.dataSource}". ` +
      `사용 가능한 값: ${Object.keys(implementations).join(', ')}`
  );
}

export const { profile: profileRepository, skills: skillsRepository, projects: projectsRepository } =
  selected;
