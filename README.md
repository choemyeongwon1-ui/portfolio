# 포트폴리오 — 프론트엔드 / 백엔드 분리 구조

내용(데이터)과 화면(HTML/CSS)을 분리하고, 데이터는 백엔드 API가 제공합니다.
나중에 데이터베이스나 외부 API를 붙일 때 고칠 곳이 한곳으로 모이도록 구성했습니다.

---

## 실행 방법

```bash
# 1) 최초 한 번 — 패키지 설치
npm install

# 2) 개발 서버 실행 (파일을 고치면 자동 재시작)
npm run dev
```

브라우저에서 <http://localhost:4000> 을 엽니다.
백엔드가 API와 프론트엔드 파일을 함께 제공하므로 서버는 하나만 켜면 됩니다.

> ⚠️ `frontend/index.html`을 파일 탐색기에서 직접 더블클릭하면 동작하지 않습니다.
> ES 모듈과 API 호출은 `http://` 주소에서만 동작하기 때문에, 반드시 `npm run dev`로 실행하세요.

---

## 폴더 구조

```
portfolio-site/
├── backend/                   API 서버 (Node.js + Express)
│   ├── .env                   내 환경 설정 (git에 올라가지 않음)
│   ├── .env.example           설정 항목 설명서
│   └── src/
│       ├── server.js          서버를 켜는 곳
│       ├── app.js             미들웨어·라우트 연결
│       ├── config/            환경변수를 읽어 설정으로 만드는 곳
│       ├── routes/            주소(URL)와 컨트롤러를 연결
│       ├── controllers/       요청을 받아 서비스에 넘기고 응답을 만듦
│       ├── services/          업무 규칙 (검증, 가공, 여러 소스 합치기)
│       ├── repositories/      ★ 데이터를 실제로 가져오는 곳
│       │   ├── index.js         ← DB로 바꿀 때 보는 파일
│       │   ├── json/            JSON 파일에서 읽기 (현재 기본값)
│       │   └── db/              DB에서 읽기 (뼈대만 있음)
│       ├── data/              profile / skills / projects / categories .json
│       ├── middleware/        404·오류 응답 처리
│       └── lib/               공통 도구 (오류 클래스 등)
│
└── frontend/                  화면 (빌드 도구 없이 동작)
    ├── index.html             뼈대만 있고 내용은 비어 있음
    ├── assets/css/style.css   기존 스타일 그대로
    └── js/
        ├── main.js            진입점 — 데이터 요청 → 그리기 → 기능 연결
        ├── config.js          API 주소 설정
        ├── store.js           받아온 데이터 보관
        ├── api/               백엔드 호출 (client.js, portfolio.api.js)
        ├── render/            데이터를 화면 요소로 바꾸는 코드
        ├── features/          동작 (네비, 필터, 공유, PDF, 등장효과)
        └── lib/               DOM·토스트 같은 작은 도구
```

**요청이 흐르는 순서**

```
브라우저 ─ fetch ─▶ routes ─▶ controllers ─▶ services ─▶ repositories ─▶ JSON 또는 DB
```

---

## API 목록

| 메서드 | 주소 | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 상태 확인 |
| GET | `/api/profile` | 이름·소개·연락처 등 기본 정보 |
| GET | `/api/skills` | 기술 그룹과 관심 키워드 |
| GET | `/api/categories` | 필터 탭 목록 |
| GET | `/api/projects` | 프로젝트 전체 |
| GET | `/api/projects?category=web` | 분야별 프로젝트 |
| GET | `/api/projects/:id` | 프로젝트 하나 |

응답 형태는 항상 같습니다.

```jsonc
// 성공
{ "data": { ... } }

// 실패
{ "error": { "code": "NOT_FOUND", "message": "프로젝트를 찾을 수 없습니다: xxx" } }
```

---

## 내용을 고치고 싶을 때

`backend/src/data/` 의 JSON 파일만 고치면 됩니다. HTML은 건드리지 않습니다.

| 고치고 싶은 것 | 파일 |
|---|---|
| 이름, 소개, 연락처, 푸터 | `profile.json` |
| 기술 항목과 퍼센트, 키워드 | `skills.json` |
| 프로젝트 카드 | `projects.json` |
| 필터 탭 | `categories.json` |

프로젝트를 하나 추가하려면 `projects.json` 배열에 항목을 하나 더 넣으면 되고,
필터·카드·PDF에 자동으로 반영됩니다.

---

## 나중에 DB를 붙이는 방법

1. 드라이버를 설치합니다.
   ```bash
   npm install mongodb --workspace backend   # 또는 pg, mysql2
   ```
2. `backend/src/repositories/db/connection.js` 에서 해당 예시의 주석을 풀고 연결을 완성합니다.
3. `backend/src/repositories/db/*.repository.js` 세 파일의 함수 안을 채웁니다.
   **json 버전과 같은 함수 이름, 같은 반환 형태**를 지키는 것이 핵심입니다.
4. `backend/.env` 를 수정합니다.
   ```env
   DATA_SOURCE=db
   DATABASE_URL=mongodb://localhost:27017
   ```

이렇게 하면 서비스·컨트롤러·라우트·프론트엔드 코드는 **한 줄도 고치지 않아도** 됩니다.

---

## 외부 API를 붙이는 방법

예를 들어 GitHub 저장소 목록을 프로젝트에 함께 보여주고 싶다면,
`backend/src/services/projects.service.js` 에서 저장소 데이터와 외부 API 응답을 합칩니다.
프론트엔드는 여전히 `/api/projects` 하나만 부르면 되므로 화면 코드는 그대로입니다.

---

## 프론트엔드를 따로 배포할 때

`frontend/` 폴더만 정적 호스팅(Netlify, Vercel, GitHub Pages 등)에 올리고,

1. `frontend/index.html` 의 `<body data-api-base="/api">` 를 백엔드 주소로 바꿉니다.
   ```html
   <body data-api-base="https://my-api.example.com/api">
   ```
2. `backend/.env` 에서 접근을 허용합니다.
   ```env
   SERVE_FRONTEND=false
   CORS_ORIGINS=https://my-portfolio.example.com
   ```
