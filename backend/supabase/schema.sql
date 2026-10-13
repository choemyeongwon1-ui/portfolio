-- portfolio-site 백엔드용 테이블 (Supabase 프로젝트: portfolio)
-- 이 백엔드(Render)는 service_role 키로만 접속하므로 RLS는 "켜두고 정책 없음"으로
-- anon/publishable 키로는 아예 못 보게 막아둔다 (같은 Supabase 프로젝트를
-- city-planning-board와 같이 쓰고 있어서, 방문 예약 이메일 같은 개인정보가
-- 다른 앱의 공개 키로 새지 않게 하기 위함).

create table if not exists public.profile (
  id   int primary key default 1,
  data jsonb not null,
  constraint profile_singleton check (id = 1)
);
alter table public.profile enable row level security;

create table if not exists public.skills (
  id   int primary key default 1,
  data jsonb not null,
  constraint skills_singleton check (id = 1)
);
alter table public.skills enable row level security;

create table if not exists public.categories (
  id          text primary key,
  label       text not null,
  description text,
  sort_order  int not null default 0
);
alter table public.categories enable row level security;

create table if not exists public.projects (
  id         text primary key,
  status     text not null default 'draft',
  category   text,
  title      text,
  role       text,
  description text,
  date       text,
  team_size  int,
  notes      text,
  link_url   text,
  link_label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.projects enable row level security;

create table if not exists public.reservations (
  id         text primary key,
  code       text not null,
  status     text not null default '접수',
  name       text not null,
  email      text not null,
  purpose    text not null,
  date       date not null,
  time       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
alter table public.reservations enable row level security;

-- 취소되지 않은 예약끼리는 같은 날짜·시간이 겹칠 수 없음 (JSON 버전의 "이미 예약된 시간" 확인을 DB 제약으로 대체)
create unique index if not exists reservations_slot_unique
  on public.reservations (date, time)
  where status <> '취소';

-- ===== 초기 데이터 (현재 backend/src/data/*.json 내용 그대로) =====

insert into public.categories (id, label, description, sort_order) values
  ('all',    '전체',   '모든 프로젝트', 0),
  ('web',    '웹',     '웹·서비스·디지털 인터페이스', 1),
  ('data',   '데이터', '분석, 시각화, 공공데이터, 공간정보(GIS)', 2),
  ('design', '디자인', '시각디자인, UX/UI, 정보구조', 3)
on conflict (id) do nothing;

insert into public.profile (id, data) values (1, '{
  "name": "최명원",
  "brand": "MW 🌿",
  "department": "그린스마트시티학과",
  "studentId": "202421390",
  "birthDate": "2004. 03. 14",
  "hero": {
    "tag": "그린스마트시티학과 🌱",
    "titleLead": "도시와 환경을 함께",
    "titleHighlight": "최명원",
    "titleBefore": "생각하는 ",
    "titleAfter": "입니다 🌿",
    "description": [
      "스마트시티, 공간정보, 데이터 분석을 기반으로 도시 문제를 이해하고",
      "지속가능한 방향으로 해결하는 역량을 키워가고 있습니다."
    ]
  },
  "card": [
    { "icon": "🎓", "label": "학번", "value": "202421390" },
    { "icon": "🌱", "label": "학과", "value": "그린스마트시티학과" },
    { "icon": "🎂", "label": "생년월일", "value": "2004년 3월 14일" }
  ],
  "about": [
    { "id": "aboutCard1", "emoji": "🎯", "title": "관심 분야", "body": "스마트시티, 도시계획, 공간정보, 환경 데이터 등 도시와 환경을 함께 고려하는 분야에 관심을 두고 있습니다." },
    { "id": "aboutCard2", "emoji": "🔍", "title": "학습 방향", "body": "공간 데이터와 도시 문제를 연결해 분석하는 과정을 통해, 기술을 실제 생활과 환경에 적용하는 사고를 키우고 있습니다." },
    { "id": "aboutCard3", "emoji": "🌱", "title": "가치관", "body": "기술은 삶의 질 향상과 지속가능한 발전을 위해 사용되어야 한다고 생각합니다. 사람 중심의 도시 설계에 의미를 둡니다." }
  ],
  "infoTable": [
    { "label": "이름", "value": "최명원" },
    { "label": "생년월일", "value": "2004. 03. 14" },
    { "label": "학과", "value": "그린스마트시티학과" },
    { "label": "학번", "value": "202421390" }
  ],
  "contact": {
    "cards": [
      { "id": "contactCard1", "icon": "🎓", "label": "소속", "value": "그린스마트시티학과" },
      { "id": "contactCard2", "icon": "🆔", "label": "학번", "value": "202421390" },
      { "id": "contactCard3", "icon": "👋", "label": "이름", "value": "최명원" }
    ],
    "greeting": "안녕하세요 👋",
    "message": "스마트시티, 도시계획, 공간정보와 관련된 프로젝트와 아이디어를 함께 나누고 싶습니다. 협업을 통해 더 나은 도시를 고민하고, 실무적으로 적용 가능한 문제 해결에 관심이 있습니다. 🌱",
    "decorations": ["🌿", "🌱", "🍃", "🌳"]
  },
  "footer": {
    "name": "최명원 🌿",
    "info": "그린스마트시티학과 · 202421390",
    "copyright": "© 2026 · 더 푸른 도시를 꿈꾸며 🌳"
  }
}'::jsonb)
on conflict (id) do update set data = excluded.data;

insert into public.skills (id, data) values (1, '{
  "groups": [
    { "id": "skillCat1", "emoji": "🏗️", "title": "도시 설계", "items": [
      { "name": "도시계획 이론", "level": 75 },
      { "name": "GIS 활용", "level": 60 },
      { "name": "건축 설계 기초", "level": 65 }
    ]},
    { "id": "skillCat2", "emoji": "💻", "title": "디지털 기술", "items": [
      { "name": "데이터 분석", "level": 70 },
      { "name": "프로그래밍 기초", "level": 55 },
      { "name": "스마트 인프라", "level": 68 }
    ]},
    { "id": "skillCat3", "emoji": "🌿", "title": "친환경 분야", "items": [
      { "name": "지속가능 개발", "level": 80 },
      { "name": "에너지 효율화", "level": 62 },
      { "name": "환경 영향 평가", "level": 58 }
    ]}
  ],
  "tags": ["스마트시티", "IoT", "도시계획", "친환경", "데이터 분석", "GIS", "지속가능성", "그린테크", "스마트 모빌리티"]
}'::jsonb)
on conflict (id) do update set data = excluded.data;

insert into public.projects (id, status, category, title, role, description, date, team_size, notes, link_url, link_label, created_at, updated_at) values
  ('smu-homepage', 'published', 'web', '상명대학교 홈페이지 살펴보기', '정보 구조 분석 및 정리',
   '문제 — 상명소개·입학안내·학사안내·대학생활 등 상위 메뉴가 여러 갈래로 나뉘어 있어, 처음 방문하면 필요한 항목의 위치를 바로 찾기 어렵습니다.' || chr(10) || chr(10) ||
   '접근 — 학생이 자주 찾는 정보를 기준으로 상단 메뉴를 따라가며, 어떤 항목이 어느 분류에 속하는지 정리했습니다.' || chr(10) || chr(10) ||
   '결과 — 공지사항과 학사일정으로 이어지는 기본 탐색 동선을 확인하고, 정보 분류 기준을 읽는 관점을 얻었습니다.',
   '2026.09', 1, '대학 홈페이지 / 정보 구조 / 웹 탐색', 'https://www.smu.ac.kr/', '상명대학교 홈페이지 바로가기',
   '2026-09-08T00:00:00.000Z', '2026-09-22T00:00:00.000Z'),

  ('greensmartcity-curriculum', 'published', 'data', '그린스마트시티학과 교육과정 정리', '교육과정 조사 및 분류',
   '문제 — 학과가 다루는 범위가 환경·도시 분야와 디지털 기술에 함께 걸쳐 있어, 한 문장으로 설명하기 어렵습니다.' || chr(10) || chr(10) ||
   '접근 — 학과 안내와 교육과정, 진로 안내 메뉴를 순서대로 확인하며 친환경 분야와 데이터·공간정보 분야를 구분해 정리했습니다.' || chr(10) || chr(10) ||
   '결과 — 환경 분야의 기반 위에 데이터와 디지털 기술이 결합된 교육 방향을 확인하고, 제 학습 계획의 기준으로 삼았습니다.',
   '2026.09', 1, '그린스마트시티 / 공간정보 / 교육과정', 'https://greensmartcity.smu.ac.kr/greensmartcity/index.do', '그린스마트시티학과 사이트 바로가기',
   '2026-09-08T00:00:00.000Z', '2026-09-22T00:00:00.000Z'),

  ('cheonan-library-guide', 'published', 'design', '천안캠퍼스 학술정보관 이용 안내 정리', '이용 흐름 설계 및 정보 정리',
   '문제 — 통합검색, 전자정보, 열람실·스터디룸 안내가 각각 다른 메뉴에 있어, 목적에 맞는 경로를 한 번에 찾기 어렵습니다.' || chr(10) || chr(10) ||
   '접근 — 자료를 찾는 경우와 공간을 이용하는 경우로 목적을 나누고, 각 상황에서 필요한 메뉴만 골라 순서대로 정리했습니다.' || chr(10) || chr(10) ||
   '결과 — 통합검색에서 소장 확인을 거쳐 시설 이용으로 이어지는 흐름을 정리해, 이용 안내를 짧게 설명할 수 있게 되었습니다.',
   '2026.09', 1, '학술정보관 / 자료 검색 / 정보 구조', 'https://libnt.smuc.ac.kr/', '천안캠퍼스 학술정보관 바로가기',
   '2026-09-08T00:00:00.000Z', '2026-09-22T00:00:00.000Z'),

  ('캠퍼스-내-조경-설계-479484', 'published', 'data', '캠퍼스 내 조경 설계', '조경설계',
   '조경설계', '2026.08-2026.09', 4, '', null, null,
   '2026-09-22T05:36:49.483Z', '2026-09-22T05:36:49.483Z')
on conflict (id) do nothing;
