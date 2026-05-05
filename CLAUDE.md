# Claude / Claude Code — 프로젝트 맵 (먼저 읽기)

## 이 프로젝트는 무엇인가

- **개인 블로그용 사이트** (도메인: flowseekerlab.io). 같은 React 앱(`apps/web`) 안에 **공개면**과 **관리자면**이 라우트로 나뉜다.
  - **공개 사이트**: `/`, `/blog`, `/blog/:slug`, `/category/:slug`, `/tag/:slug`, `/search` 등 (`apps/web/src/App.jsx` 참고).
  - **관리자**: `/admin` (로그인), `/admin/dashboard`, 글·카테고리·태그·미디어·설정 등 (`/admin/*`).
- 작업 흐름: **Horizon AI → Cursor AI → Claude Code** 로 마무리. 넘겨받은 쪽은 **전체 탐색 없이** 필요한 경로만 보고 이행한다.

### 반드시 지켜야 할 제품 요구 (데이터 일관성)

- 공개 사이트와 관리자는 **같은 PocketBase**를 본다. 관리자에서 글·설정을 저장하면 **공개 사이트에 실제로 반영**되는 것이 핵심이다 (별도 정적 복붙이 아님).
- 글/카테고리/태그/CMS 설정 등은 **컬렉션·규칙이 공개 읽기와 관리자 쓰기 권한**이 맞게 짝지어져야 한다. 이슈가 “관리자에선 보이는데 공개에 안 나온다”면 PB 규칙·필드명·쿼리·캐시를 우선 의심한다.

### 최종 목표

- **개인용 블로그로 실사용 가능한 수준**까지 갖추는 것: 글 발행, 목록·상세, 카테고리/태그, 사이트 메타·푸터 등 **기본 형태가 끝까지 연결**되어 있어야 한다.

### 현재 알려진 공백 (우선 채울 것)

- 관리자 **카테고리 관리**·에디터 쪽이 기대만큼 동작/노출되지 않음 (`/admin/categories`, `CategoriesPage.jsx` 등).
- **홈페이지 전역 설정**(사이트명, 소개, 푸터 링크 등 CMS/`cms_settings` 류)을 관리자에서 다루기 어렵거나 UI가 비어 있음 (`/admin/settings`, `SettingsPage.jsx`, PB 마이그레이션의 settings 컬렉션).
- 위가 해결되기 전까지는 “기본 블로그 형태가 완성됐다”고 보기 어렵다. 작업 시 **공개 페이지가 같은 데이터를 읽는지**까지 확인할 것.

## 에이전트 목표 (크레딧 절약)

- **목표**: 저장소 전체를 훑지 않는다. 아래 **이행 순서**와 **작업 → 경로** 표만 보고, 이슈에 맞는 디렉터리만 연다.
- `node_modules`, `dist`, `pb_data` 안의 DB 바이너리를 **대량 읽거나 전역 grep** 하지 않는다.
- env·URL 규칙은 **세 개의 `*.example` 파일**만 읽고 추측하지 않는다:  
  `apps/web/.env.example`, `apps/web/.env.production.example`, `apps/api/.env.example`.

---

## 넘겨받은 뒤 이행할 때 (권장 확인 순서)

1. **이 파일(`CLAUDE.md`) 전체** — 맥락 고정.
2. **작업 종류**에 맞춰 표 **한 줄**만 골라 해당 경로만 연다.
3. 빌드·배포 이슈면: 루트 `package.json` scripts + `apps/web/package.json`의 `build`만 추가로 확인.
4. 백엔드·스키마 이슈면: `apps/pocketbase/pb_migrations` (필요 시 같은 이슈 관련 파일만) + `pb_hooks`는 훅 수정 시에만.
5. **커밋/푸시 전**: 아래 **GitHub에 올리면 안 되는 것** 절차로 `git status`를 한 번 본다.

---

## 기술 스택·구조 (한 블록)

- **모노레포**: `package.json` workspaces `apps/*`.
- **스택**: Vite + React (`apps/web`), Express (`apps/api`), PocketBase (`apps/pocketbase`).
- **프로덕션 가정**: 정적 사이트 + **동일 출처** PocketBase URL (`apps/web/.env.production.example`: `VITE_POCKETBASE_URL=/hcgi/platform`). 로컬은 `127.0.0.1:8090` 전체 URL.

### 기본 포트

| 앱 | 포트 | 경로 |
|----|------|------|
| Web (Vite) | 3000 | `apps/web` |
| API (Express) | 3001 | `apps/api` |
| PocketBase | 8090 | `apps/pocketbase` |

### 명령 (루트에서)

```text
npm install && npm run bootstrap && npm run setup   # 첫 클론 후
npm run dev                                         # web + api + pb
npm run build:website                               # 프로덕션 웹 빌드 (CI와 동일)
npm run lint                                        # web + api
```

- 부트스트랩: `tools/bootstrap.mjs` (`*.example` → `.env`, 대상 파일이 없을 때만 복사).

### 자주 하는 작업 → 어디부터 볼지

| 작업 | 시작 경로 |
|------|-----------|
| UI, 라우트, 공개 블로그 페이지 | `apps/web/src/pages` (공개), `App.jsx` |
| 관리자 화면 (글·카테고리·설정 등) | `apps/web/src/pages/admin`, `components/admin` |
| 빌드 / 사이트맵 / RSS / 프로덕션 env 검증 | `apps/web/tools/*.mjs` |
| HTTP API, 미들웨어 | `apps/api/src` |
| DB 스키마, 컬렉션, 규칙 | `apps/pocketbase/pb_migrations` |
| PB 훅 (피드 등) | `apps/pocketbase/pb_hooks` |
| SEO 기본값, 법적 문구 | `apps/web/src/lib/seo.js`, `apps/web/src/content/legal.js` |

### PocketBase

- 스키마 변경: `pb_migrations/`에 파일 추가·수정 (관례: 타임스탬프 접두어).
- 바이너리 버전: `apps/pocketbase/.pocketbase-version`.
- 웹만 수정할 때는 import/타입이 필요하지 않은 한 `apps/api`, `apps/pocketbase`는 건드리지 않는다.

### CI

- `.github/workflows/verify-build.yml` — Node 22, `npm ci`, `npm run build:website` 만.

### 운영 문서

- Railway PocketBase 배포·볼륨·Variables: [docs/railway-pocketbase.md](docs/railway-pocketbase.md).

---

## GitHub에 올리면 안 되는 것 (민감·개인정보)

원칙: **비밀·본인 식별·서버/계정 자격은 저장소에 두지 않는다.** 토큰·비밀번호·API 키·실제 이메일(비공개)·실명·전화·주소·PB 슈퍼유저 비밀번호 등은 **`.env` / 로컬 설정 / DB**에만 둔다.

### `.gitignore`로 막는 항목 (이 레포 기준)

- `node_modules/`, `dist/`, `build/`, `.vite/`
- 모든 **실제** `.env`, `.env.local`, `.env.*.local`, (비템플릿) `.env.production`
- `apps/pocketbase/pocketbase`, `pocketbase.exe`
- **`apps/pocketbase/pb_data/*.db`** 및 WAL/SHM, `pb_data/backups/`
- 로그, `app.tar.gz` 등

### 커밋 전에 사람이 할 일

- `git status`로 **추적 예정 파일**에 `.env`, `*.db`, 바이너리, 백업이 없는지 확인한다.
- 새 도구를 쓰면서 생긴 **로컬 전용 설정 파일**이 생겼는지 확인하고, 필요하면 `.gitignore`에 추가한다.
- 마이그레이션·시드에 **실서비스 개인정보**를 넣었다면 제거하거나 익명화한다.
- `*.example`에는 **가짜 값·플레이스홀더**만 두고, 실제 비밀은 넣지 않는다.
- **과거에** `pb_data` DB나 `.env`를 푸시한 적이 있다면 Git 히스토리에 남을 수 있다. 민감 데이터가 들어 있었다면 자격 증명 교체와, 필요 시 히스토리 정리(bfg 등)를 검토한다.

---

## `CLAUDE.md`를 유지보수할 때 (운영자 메모)

이 파일은 **에이전트가 처음 읽는 한 장**이면 된다. 길게 쓸수록 토큰만 늘어난다.

- **넣으면 좋은 것**: 도메인/호스팅 한 줄, 배포 방식(예: Hostinger 정적 + PB 프록시), “지금 막힌 작업” 전용 임시 메모(해결 후 지우기).
- **줄여도 되는 것**: 이미 `README.md`와 중복되는 설치 명령 긴 설명.
- **주기적으로**: 더 이상 쓰지 않는 경로·스크립트 이름을 지워서 **현재 트리와 맞춘다**.
- **민감 정보는 절대 넣지 않는다** (이 파일도 Git에 올라감).

---

## 에이전트용 규칙 (요약)

1. 이 파일 + **해당 작업 경로만** 연다.
2. env는 **`*.example` 세 파일**로만 이해한다.
3. `pb_data`, PB 실행 파일, `node_modules`, `dist`를 통째로 읽지 않는다.
4. 변경이 프론트만이면 api/pb는 건드리지 않는다.
