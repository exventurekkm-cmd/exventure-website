# exventure-website

엑스벤처 공식 홈페이지의 배포 기반입니다. 현재는 준비 중 안내 화면과 `/api/health`만 제공합니다.

회사·사업 소개, 문의 접수, AI 도구 소개와 연결, 직원용 콘텐츠 관리 화면을 순차적으로 구현할 예정입니다. 공개 전까지 검색 노출을 비활성화합니다. 이 설정은 접근 제한을 대신하지 않습니다.

## 개발

Node.js 24에서 `npm ci`, `npm run dev`를 실행합니다. 개발 주소는 `http://127.0.0.1:3003`입니다. `.env.example`을 참고하여 로컬 환경을 구성하고 `npm run check`로 검사합니다.

## 운영

- GitHub: `exventurekkm-cmd/exventure-website`, 운영 브랜치 `main`
- Vercel: 회사 팀 `exventurekkm`의 `exventure-website`, 서울 리전
- Supabase: 홈페이지 전용 `exventure-website`, 서울 리전
- 운영 주소: `https://exventure-website.vercel.app`

홈페이지 콘텐츠·문의·파일은 전용 DB에서 관리하고, 향후 직원 인증은 기존 `exventure-accounts`에 연결합니다. 현재 앱은 DB 테이블, 관리자 로그인, 문의 전송을 구현하지 않습니다. 관련 기능을 추가할 때 접근 정책과 데이터 구조를 함께 적용합니다. 비밀 키는 서버 환경에만 보관하며 원문 기획 자료와 로컬 환경 파일은 커밋하지 않습니다.
