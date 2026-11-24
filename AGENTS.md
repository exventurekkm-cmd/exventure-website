<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 엑스벤처 공동 작업

작업을 시작하거나 재개할 때는 편집 전에 인프라의 열린 이슈, 관련 저장소의 열린 PR과 로컬 작업 트리에서 같은 기능이나 경로를 누가 맡고 있는지 확인한다. [인프라 이슈](https://github.com/exventurekkm-cmd/exventure-infra/issues)

홈페이지·통합 계정·업무 플랫폼을 하나의 엑스벤처 서비스로 관리한다. 로그인·로그아웃, 권한, 직원 메뉴, 업무 모듈 진입 경로를 바꿀 때는 기능을 제공하는 저장소와 그 기능을 사용하는 모든 화면을 먼저 확인한다. 여러 대화나 프로젝트에 걸리면 같은 이슈에 담당 경로, 각 PR·검증 커밋과 실제 사용자 동선의 결과를 남긴다. 독립적으로 끝나는 변경은 해당 저장소의 기존 절차를 따른다. [공동 작업 절차](https://github.com/exventurekkm-cmd/exventure-infra/blob/main/REPOSITORIES.md#공동-작업)

공통 로그인이나 이름 메뉴를 바꿀 때는 인프라의 `operations/check-platform.mjs`를 해당 작업 폴더 조합으로 실행한다. 배포가 요청된 작업은 영향받는 사이트의 배포와 연결 동선을 확인한 뒤 공동 이슈를 닫는다. [플랫폼 통합 검증](https://github.com/exventurekkm-cmd/exventure-infra/blob/main/REPOSITORIES.md#플랫폼-통합-검증)
