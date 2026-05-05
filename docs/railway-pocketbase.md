# Railway PocketBase 배포 메모

PocketBase(`apps/pocketbase`)를 Railway에서 운영할 때 필요한 항목만 모은다. 실제 비밀값·DB 파일은 절대 이 문서에 적지 않는다.

## pb_data 볼륨 마운트

- Railway 서비스 **Root Directory**가 `apps/pocketbase`이면 컨테이너 안 cwd는 보통 `/app`이고 `pb_data`는 **`/app/pb_data`**다. Volume **Mount Path**를 그 경로에 맞춘다. [railway-start.mjs](apps/pocketbase/railway-start.mjs)는 `--dir=./pb_data`(cwd 기준)로 띄우므로, 마운트가 어긋나면 데이터가 컨테이너 임시 디스크에만 생긴다.
- 볼륨이 비어 있으면 PB가 새 DB를 만든다. 마운트 경로를 잘못 지정한 채 한 번이라도 부팅하면 컨테이너 임시 디스크에 DB가 생기고, 재배포 시 사라진다.
- 재배포는 **롤링이 아니라 새 컨테이너로 갈아끼우는** 형태이므로, 같은 볼륨을 재부착하는지(서비스/볼륨 연결 유지) 매번 확인한다. 백업은 `pb_data/backups/`에 두지 말고 외부로 빼낸다(레포 무시 대상).

## Railway Variables (이름만)

- 필요한 키 이름은 다음과 같다(값은 Railway 콘솔에만 둔다):
  - `PB_ADMIN_USER_EMAIL`
  - `PB_ADMIN_USER_PASSWORD`
  - `PB_SUPERUSER_EMAIL`
  - `PB_SUPERUSER_PASSWORD`
- 위 값과 실제 `.env`는 **저장소에 절대 커밋하지 않는다**. `*.example`에는 이름과 플레이스홀더만 두고, 실값은 Railway Variables → 서비스에서만 관리한다.
- 비밀번호를 회전하면 PB 슈퍼유저/관리자 계정에 동일하게 반영되었는지 확인한다.

## 웹 프로덕션 URL

- [apps/web/.env.production.example](apps/web/.env.production.example)의 `VITE_POCKETBASE_URL`을 Railway PocketBase의 **공개 도메인**(예: `https://api.flowseekerlab.io` 또는 Railway가 발급한 `*.up.railway.app`)으로 맞춘다. 빌드 시 정적으로 박히므로 변경하면 **재빌드 필요**.
- CI는 `VITE_POCKETBASE_URL` GitHub Secret으로 덮어쓴다([.github/workflows/verify-build.yml](.github/workflows/verify-build.yml) 참고). 로컬 미커밋 `.env.production`이 있다면 사람이 직접 정리한다.

## PB_ENCRYPTION_KEY

- 쓸 거면 **32자 이상 고정 문자열** 하나를 정해서 Railway Variables에만 둔다. **값을 바꾸면 기존 `pb_data` 안의 암호화된 settings를 더 이상 못 읽는다**.
- 안 쓸 거면 변수 자체를 **비우거나 미설정**으로 둔다. [railway-start.mjs:25](apps/pocketbase/railway-start.mjs#L25)이 값이 있을 때만 `--encryptionEnv=PB_ENCRYPTION_KEY`를 붙이므로, 빈 값이면 평문 모드로 부팅된다.

## 있으면 좋음

- **커스텀 도메인·TLS**: Railway에서 `api.flowseekerlab.io`를 서비스에 연결하고 TLS는 Railway 자동 발급을 쓴다.
- **관리자 UI 노출 줄이기**: `/_/` 경로는 신뢰 IP에서만 쓰거나, 강한 슈퍼유저 비밀번호 + 비밀번호 매니저로만 접근한다.
- **로컬 미커밋 변경**: 사람이 손으로 만진 `.env*`·`pb_data/*`는 Git에 올리지 않고 따로 백업·정리한다.

## 배포 검증 체크 (3가지)

1. **관리자에서 글 작성** — `/admin`에서 로그인 후 새 글을 발행한다.
2. **공개 페이지 노출 확인** — `/blog` 및 해당 글의 `/blog/:slug`에서 같은 데이터가 보이는지 확인한다.
3. **재배포 후 데이터 유지** — Railway에서 한 번 재배포한 뒤 위 글이 그대로 남아있는지(=`pb_data` 볼륨이 재부착됐는지) 확인한다.

## 금지(반복)

- `apps/pocketbase/pb_data/*.db`, WAL/SHM, `pb_data/backups/` 커밋 금지.
- 실제 `.env`(템플릿 아닌 것) 커밋 금지.
- 위 모든 비밀값(이메일·비밀번호·암호화 키)은 Railway Variables에서만 관리.
