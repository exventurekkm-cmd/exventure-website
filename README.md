# exventure-website

엑스벤처 공식 홈페이지입니다. 승인된 공개 디자인과 로그인 입구를 제공하며 문의 최소 흐름의 로컬 구현을 포함합니다. 운영 문의 접수는 기본 비활성화입니다.

공개 로그인은 `/login` 한 곳에서 직원 워크스페이스의 `/auth/staff/start`로 이어집니다. 회사 계정 인증과 기능 권한은 기존 accounts 제공자가 검사합니다. 홈페이지의 관리용 OAuth client/문의 DB·키와 직원 client를 결합하지 않습니다. 직원 전용 client, DB migration 및 workspace 설정의 보안 승인·검증 후 세 앱 동선을 함께 배포해야 합니다.

`/contact`는 서버 검증·저장·동의·접수번호 안내를, `/privacy`는 동일한 연락처 설정을 사용하는 문의 개인정보 안내를 제공합니다. `/admin/login`의 중앙 public-client OAuth/PKCE·검증된 서버 세션·요청별 권한 검사와 관리자 문의 확인·완료 삭제·연락처 설정·만료 purge 코드가 준비돼 있습니다. 실제 client/grant/환경 설정과 원격 통합 검증은 실행하지 않았습니다. 검색 제외는 접근 제한을 대신하지 않습니다.

## 개발

Node.js 24에서 `npm ci`, `npm run dev`를 실행합니다. 개발 주소는 `http://127.0.0.1:3003`입니다. `.env.example`을 참고하여 로컬 환경을 구성하고 `npm run check`로 검사합니다.

## 운영

- GitHub: `exventurekkm-cmd/exventure-website`, 운영 브랜치 `main`
- Vercel: 회사 팀 `exventurekkm`의 `exventure-website`, 서울 리전
- Supabase: 홈페이지 전용 `exventure-website`, 서울 리전
- 운영 주소: `https://exventure-website.vercel.app`

운영 문의 저장은 전용 Supabase의 서버 전용 RPC를 사용합니다. `supabase/migrations`는 검토용이며 자동 적용하지 않습니다. 로컬 SQLite와 PGlite는 합성 데이터 검증용으로, 운영 DB를 대신하지 않습니다. `.env.example`의 문의 설정은 기존 공개 연결과 분리되어 있고 기본 비활성화입니다. 실제 비밀 키를 생성하지 않았으며 서버 환경에만 설정해야 합니다. 원문 기획 자료·로컬 DB·실제 계정 정보·환경 파일은 커밋하지 않습니다.

[문의 운영 경계·승인된 수집/보존 기준·관리자 연결·Preview 분리·검증 한계](docs/inquiry-operations.md)를 먼저 읽습니다. 기존 홈페이지 Preview의 운영 공개 DB 연결을 테스트 환경으로 분리하기 전에는 원격 문의를 활성화하지 않습니다.

## 로컬 가상 데이터 검증

`npm run test`는 Node의 API/토큰/SQLite/권한 fixture 검사와 격리 PostgreSQL(PGlite)에서 migration/RLS/서버 RPC 검사를 실행합니다. 운영 연결은 하지 않습니다. `npm run check`는 이 검사와 타입·빌드를 실행합니다.

화면 확인은 `WEBSITE_INQUIRY_MODE=local-test`, loopback `WEBSITE_INQUIRY_ORIGIN`, 32자 이상 합성 테스트 문자열인 `WEBSITE_INQUIRY_SIGNING_SECRET`, `WEBSITE_INQUIRY_LOCAL_ADMIN_ROLE=admin`을 해당 로컬 프로세스에만 설정합니다. Vercel에서는 local-test를 허용하지 않습니다. `/admin/inquiries/settings`에서 가상 삭제 연락처(예: privacy@example.invalid)를 저장한 뒤 `/contact`를 확인합니다. 실제 개인정보를 입력하지 않습니다. 테스트 DB는 무시되는 `.local/inquiries-test.sqlite`에만 저장합니다. 이 모드는 실제 로그인 성공이나 운영 권한을 증명하지 않습니다.

실제 로컬 Supabase/OAuth 통합 코드는 [.env.local-integration.example](.env.local-integration.example)의 별도 명시적 설정을 사용합니다. 홈페이지 `127.0.0.1:3003`, 중앙 Auth `127.0.0.1:58421`, accounts `127.0.0.1:3002`, 홈페이지 DB API `127.0.0.1:58621`만 허용합니다. 브라우저에서 localhost를 섞어 쓰지 않습니다. 이 모드는 SQLite 관리자 fixture를 사용하지 않으며 중앙 OAuth 서명 검증과 매 요청 홈페이지 admin 권한 검사를 유지합니다. Vercel 표식 또는 운영 DB 설정이 있으면 비활성화됩니다. 실제 test stack의 비밀 설정 파일은 인프라 담당자가 별도로 전달하며 이 저장소에는 추가하지 않습니다.
