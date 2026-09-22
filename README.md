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

## 실제 공개 배포 구조 (Vercel + Render, GitHub Pages도 함께)

화면과 서버를 서로 다른 무료 서비스에 나눠 올립니다. 화면은 두 곳(Vercel, GitHub Pages)
어디서 봐도 같은 내용이 나오고, 둘 다 같은 백엔드(Render)를 바라봅니다.

```
portfolio-<...>.vercel.app          ┐
                                     ├─ fetch('/api/...') ─▶  portfolio-backend-ehgr.onrender.com
choemyeongwon1-ui.github.io/portfolio/  ┘                     (Render, 항상 켜진 서버)
      화면 (정적 파일, 둘 다 같은 내용)                              데이터 (API)
```

### 화면 — Vercel과 GitHub Pages

둘 다 `frontend/` 를 그대로 정적으로 올리되, **관리자 페이지(`admin.html`)는 둘 다 빼고 올립니다.**
정적 호스팅은 서버를 못 돌리므로 관리자 기능(로그인·저장)이 애초에 동작할 수 없고,
동작하지 않는 로그인 화면을 공개해 둘 이유가 없기 때문입니다.

| | 방식 |
|---|---|
| Vercel | `vercel.json` 의 `buildCommand` 가 `frontend/` 를 복사하며 admin 관련 파일만 뺀다. GitHub에 푸시할 때마다 Vercel이 자동으로 다시 빌드한다(이미 연결되어 있음). |
| GitHub Pages | `.github/workflows/deploy-pages.yml` 이 같은 일을 하는 워크플로다. `refactor/split-frontend-backend` 브랜치에 푸시될 때마다 실행된다. |

`frontend/js/config.js` 의 `PRODUCTION_API_BASE` 가 Render 주소를 가리킵니다.
`localhost`가 아닌 곳(Vercel이든 Pages든)에서 열리면 자동으로 이 주소로 API를 부릅니다.

### 데이터 — Render

`render.yaml` 이 Render의 "Blueprint" 설정입니다. `backend/` 폴더를 그대로 `npm install` →
`npm start` 로 띄웁니다 — 서버리스가 아니라 **계속 켜져 있는 진짜 서버**라서, `backend/src/server.js`
를 고칠 필요가 전혀 없습니다. 다음 환경변수를 이 파일이 미리 정해 둡니다.

| 변수 | 값 | 이유 |
|---|---|---|
| `SERVE_FRONTEND` | `false` | 화면은 Vercel/Pages가 담당하므로 Render는 API만 |
| `ENABLE_ADMIN` | `false` | 아래 참고 |
| `DATA_SOURCE` | `json` | `backend/src/data/*.json` 을 그대로 읽음 |
| `ADMIN_PASSWORD_HASH` | (직접 입력) | 비밀 값이라 파일에 적지 않음. Render가 만들 때 물어본다 |

> ⚠️ Render 무료 플랜은 15분 동안 요청이 없으면 서버가 잠들고, 다음 요청이 오면 다시
> 깨우는 데 최대 1분 가까이 걸립니다. `frontend/js/config.js` 의 요청 제한시간을 이를
> 감안해 넉넉히 잡아 뒀습니다 — 방문이 뜸한 개인 포트폴리오에는 무리 없지만,
> "잠깐 접속이 안 되나?" 싶은 첫 로딩이 생길 수 있다는 뜻입니다.

### 관리자 페이지는 왜 로컬에서만 쓰는가

이 저장소의 저장 방식은 **파일에 직접 쓰는 방식**입니다. Render 무료 플랜의 파일 저장은
서버가 잠들었다 깨면(또는 다시 배포하면) 초기화되므로, 배포된 서버에서 저장한 내용이
계속 남아 있다는 보장이 없습니다. 그래서 실제 글쓰기는 내 컴퓨터
(`npm run dev` → `localhost:4000/admin.html`)에서만 하고, 저장한 내용을 git에 커밋·푸시하면
Vercel·Pages가 화면을, Render가 API를 각각 다시 배포하면서 공개 사이트에 반영됩니다.

```
관리자 페이지에서 저장 (로컬)
        ↓
git commit + push
        ↓
Vercel + Pages → 화면 재배포        Render → API 재배포
        ↓                                  ↓
       공개 사이트에 새 내용 반영
```

파일 업로드를 계속 해야 하는 불편함은 없어졌지만, "어디서나 편집"이 아니라
"내 컴퓨터에서 편집 → 자동으로 공개"인 구조입니다. 나중에 진짜 데이터베이스를 붙이면
(위 "나중에 DB를 붙이는 방법" 참고) 관리자 페이지도 배포된 서버에서 그대로 켤 수 있습니다.

### 처음 연결할 때 (한 번만)

아래는 각 서비스 대시보드에서 직접 해야 합니다 — 이 저장소의 코드만으로는 할 수 없습니다.

**Render (백엔드)**
1. [render.com](https://render.com) 가입 (카드 등록 없이 무료로 가능) → **New + → Blueprint**
2. 이 GitHub 저장소 선택 → Render가 `render.yaml` 을 읽어 자동으로 설정을 채운다
3. `ADMIN_PASSWORD_HASH` 칸에 값을 입력하라고 물어본다 — 내 컴퓨터의 `backend/.env` 에서
   `ADMIN_PASSWORD_HASH=` 뒤의 값을 그대로 복사해 붙여넣는다 (비밀번호 원문이 아니라 해시값)
4. Create — 몇 분 뒤 `https://portfolio-backend-ehgr.onrender.com` 같은 주소가 생긴다

**Vercel (화면)**
1. 이미 이 GitHub 저장소에 연결되어 있다면 그대로 둔다 (`vercel.json` 을 자동으로 읽는다)
2. 처음 연결하는 경우: Vercel → **Add New → Project** → 이 저장소 선택 →
   Framework Preset은 **Other**, Root Directory는 저장소 루트 그대로
3. **Deployment Protection을 끈다** — Project → Settings → Deployment Protection.
   켜져 있으면 화면 대신 Vercel 로그인 페이지가 나온다
4. Production Branch를 `refactor/split-frontend-backend` 로 지정하거나, 준비되면 `main` 에 병합한다

**둘 다 연결한 뒤**, Render가 실제로 배정한 주소가 `frontend/js/config.js` 의
`PRODUCTION_API_BASE` 와 다르면, 그 한 줄만 실제 주소로 고치면 됩니다.

---

## 프론트엔드를 다른 곳에 배포할 때

위 GitHub Pages 대신 Netlify 등 다른 정적 호스팅을 쓰고 싶다면,

1. `frontend/index.html` 의 `<body data-api-base="/api">` 를 백엔드 주소로 바꿉니다.
   ```html
   <body data-api-base="https://my-api.example.com/api">
   ```
2. `backend/.env` (또는 Vercel 환경변수)에서 접근을 허용합니다.
   ```env
   CORS_ORIGINS=https://my-portfolio.example.com
   ```
