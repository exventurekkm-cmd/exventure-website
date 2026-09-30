# 문의 최소 흐름 · 운영 전 검토

2026-09-30. 문의 화면·서버·중앙 OAuth/session 연결 코드·purge 진입점·migration·로컬 fixture와 명시적 loopback 통합 경로를 구현했다. 운영 접수는 기본 비활성화다. 운영 OAuth 등록·grant·credential·migration·DB 환경 변경은 실행하지 않았다. 별도 담당자가 구성한 승인된 가상 로컬 환경에서 실제 Supabase/OAuth 브라우저 통합을 검증했다. 일반 코드 게시와 운영 접수 활성화는 별개다.

## 확정한 범위와 개인정보 기준

담당자는 안진영이다. 필수 이름(실명 인증 없음)·회신 이메일·문의 종류·본문, 별도 선택 동의가 있는 회사·기관명만 수집한다. 동의는 모두 기본 미선택이다. 회사명 선택 동의가 없으면 브라우저가 보내지 않으며 서버 검증·저장 어댑터·SQL에서도 제외한다. 관리자 화면에서 확인하며 이메일 알림·첨부파일·CRM은 추가하지 않는다.

목적은 문의 접수·내용 확인·답변이다. 처리 완료 시 문의 레코드를 삭제하고, 미종결 문의도 접수일로부터 최대 90일까지 보유한다. 90일은 장기 방치를 막기 위한 운영 상한이며 법정 보존 기간이나 완료 후 90일 보관을 뜻하지 않는다. 필수 동의 거부권과 거부 시 이 폼으로 접수하기 어렵다는 점, 선택 동의 거부가 접수를 막지 않는다는 점을 개별 안내한다. 본문에 민감정보·타인정보를 입력하지 않도록 안내한다. 처리방침 전체 동의로 수집 동의를 대신하지 않는다. 부모가 확인한 근거: [개인정보보호법 21조](https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1006183947), [15조 2항](https://law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1020398563), [2026 개인정보 처리방침 작성지침](https://pipc.go.kr/np/cop/bbs/selectBoardArticle.do?bbsId=BS217&mCode=D010030030&nttId=12018).

공개 삭제 연락처는 사용자가 별도로 승인했다. 실제 주소는 공개 코드에 하드코딩하지 않고 website_private.settings.privacy_contact_email에 저장한다. 관리자 로그인 이메일과 다른 설정이다. 최초 migration은 이 값을 빈 문자열로 만든다. 홈페이지별 admin 권한을 가진 담당자가 설정 UI에서 입력해야 한다. 연락처가 없거나 읽기 실패 시 접수는 차단된다. 저장은 이메일 검증·낙관적 버전 검사를 거치며 이전/새 주소·변경자 회사 account ID·버전·시각만 비공개 이력에 남긴다. 토큰·비밀 키·문의 본문은 설정 이력에 넣지 않는다. 새로운 문의 폼과 개인정보 안내는 같은 설정을 매 요청 읽는다. 열린 폼의 연락처/안내가 바뀌면 이전 동의 토큰으로 접수하지 않는다.

문의 담당자 지정만으로 개인정보 보호책임자 또는 고충담당자의 법적 지위를 확정하지 않는다. 실제 처리 주체의 표기·호스팅 업체/국가·위탁/국외 이전·공개 처리방침의 나머지 항목은 별도 확인이 필요하다. `docs/inquiry-privacy.template.json`은 빈 템플릿이며 실제 법적 문구가 아니다. 검토한 처리 주체·연락 담당 역할·위탁 업체/항목/국가/보유 기준·국외 이전 안내를 `WEBSITE_INQUIRY_PRIVACY_DETAILS_JSON`에 준비한다. 처리 주체와 안내 버전은 POLICY_JSON과 같아야 한다. 빈 값·pending·불일치 또는 검토 승인 누락이면 원격 접수는 차단된다. 폼·안내에 전체 처리방침 동의를 대신 요구하지 않는다.

## 저장과 요청 경계

- /contact, /privacy, /api/inquiries. 서버 검증·요청 크기 상한(24 KiB)·정확한 Origin·fetch metadata·JSON 요청만 허용한다. 완료 표시는 저장 응답을 받은 후에만 한다. 실패·타임아웃은 입력을 유지하고 동일 요청을 다시 제출할 수 있게 한다.
- 로컬 Next.js는 127.0.0.1 브라우저 요청의 내부 URL을 localhost로 만든다. 명시적 local-test fixture에서만 내부 HTTP localhost 별칭을 허용하며, 실제 Origin·Host·포트 일치와 fetch metadata 검사는 유지한다. 원격 환경은 URL origin까지 정확히 일치해야 하며 forwarded-host/proto로 이 검사를 우회하지 않는다.
- 서명 토큰은 요청 UUID·발급 시각·안내 해시를 포함하며 30분간 유효하다. 1초 미만 제출·변조·만료·안내 변경은 거절한다. 실제 서명 credential을 생성하지 않았다. WEBSITE_INQUIRY_SIGNING_SECRET은 서버 설정 슬롯이다. 테스트는 유효한 운영 키가 아닌 명시적 합성 문자열을 사용한다.
- DB는 요청 UUID와 payload HMAC을 함께 사용한다. 동일 요청 재시도는 같은 접수번호를 반환하고, 다른 내용 재사용은 거절한다. SQLite는 로컬 테스트에서만 사용하며 Vercel에서는 선택할 수 없다. 운영은 Supabase RPC를 사용하고 같은 입력·동의·보존·상태 계약을 따른다.
- durable 예산: IP별 고정 10분 5건, 회신주소별 고정 1시간 3건, 전체 고정 1시간 100건. 식별자는 서버 HMAC이며 원문 IP를 저장하지 않는다. 이 예산의 식별 레코드 TTL은 최대 1시간이다. Vercel에서만 덮어쓴 x-vercel-forwarded-for를 사용하며 로컬 원격 요청에서 임의 forwarded-for를 신뢰하지 않는다. [Vercel 요청 헤더](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for)
- website_private의 모든 테이블에 RLS를 켜고 public/anon/authenticated의 schema·테이블·sequence 접근과 RPC 실행을 명시적으로 거절한다. 서버의 service_role만 최소 작업 권한을 가진다. 함수는 SECURITY INVOKER이며 새 역할·권한 우회·Storage bucket·외부 전송은 만들지 않는다. service_role은 RLS를 우회하므로 관리자 작업의 매 요청 권한 검사가 반드시 먼저 적용되어야 한다. [Supabase 함수 권한](https://supabase.com/docs/guides/database/functions#function-privileges)

## 관리자 인증 연결

로컬 fixture에서 /admin/inquiries와 /admin/inquiries/settings, 완료 삭제/연락처 수정 API를 검증한다. local-test·loopback·VERCEL 환경 없음·WEBSITE_INQUIRY_LOCAL_ADMIN_ROLE=admin을 모두 만족해야 한다. 기본 fixture 역할은 viewer이며 조회·설정·삭제가 거절된다. 실제 회사 계정/쿠키/권한을 사용하거나 변경하지 않는다.

`/admin/login`, `/auth/company/start`, `/auth/company/callback`, POST `/auth/company/logout`을 기존 accounts/workspace의 public-client Authorization Code+PKCE 계약으로 구현했다. `openid-client` 6.8.8의 ES256 non-repudiation 검증을 사용하고 임의 JWT/OAuth 프로토콜은 만들지 않는다. state/nonce와 S256 PKCE, issuer/audience/서명/만료 검증을 모두 거친다. OAuth client secret은 요구하지 않는다. 로그인 시도는 AES-256-GCM 암호화한 10분 HttpOnly/Secure/SameSite=Lax 쿠키로 관리하며, 성공 시 브라우저에는 임의 256-bit 세션 ID만 둔다. access token은 암호화해 website_private.company_sessions에 저장하고 DB에는 ID의 SHA-256만 저장한다. 만료는 ID token/access token 기간과 1시간 중 짧은 기간에서 15초를 뺀 값이다. 홈페이지용 Supabase Auth 사용자·이메일 동일인 자동 연결·refresh token 발급은 추가하지 않는다.

검증된 session subject는 서버 설정 `WEBSITE_COMPANY_ADMIN_ACCOUNT_ID`와 같아야 한다. 관리자 페이지 및 목록·설정·완료 삭제·purge의 보호된 요청마다 기존 `/api/identity/access?application=exventure-website`를 캐시 없이 다시 호출한다. active=true·application_id·account_id·role=admin이 모두 맞아야 한다. 권한 회수·다른 사이트 역할·viewer/member·통신 실패·세션 만료는 모두 거절하고 서버 세션을 무효화한다. company_admin 플래그를 홈페이지 권한으로 대신 사용하지 않는다. Origin·JSON 검사는 권한 검사 뒤에도 유지하며 헤더로 사용자를 대체하지 않는다. 로그아웃은 same-origin POST로 서버 세션 삭제를 확인한 후 쿠키를 지운다.

운영 중앙 사이트/클라이언트/grant와 credential은 아직 준비하지 않았다. 승인된 가상 로컬 client/grant/key는 별도 인프라 담당자가 공급했다. 기본 SSO_ENABLED/AUTH_PROVISIONED=false이며 값 누락 시 준비 상태/503 또는 관리자 거절이다. Production은 기존 중앙 issuer/portal을 유지한다. 비운영 HTTPS 경로는 별도의 `WEBSITE_COMPANY_TEST_PROJECT_REF`와 HTTPS `WEBSITE_COMPANY_TEST_PORTAL_ORIGIN`을 명시해야 하며 운영 계정/업무/홈페이지 ref와 운영 portal을 거절한다. 중앙 운영 Auth로 자동 fallback하지 않는다. 저장소/관리자 설정 준비는 공개 접수 MODE=disabled 및 개인정보 검토 대기 중에도 가능하도록 분리했다.

## 승인된 로컬 Supabase/OAuth 통합 계약

`.env.local-integration.example`은 비밀 값 없는 설정 슬롯이다. 홈페이지만 아래 고정 경계를 사용하며 다른 저장소·Docker·스택·키·grant를 생성하거나 변경하지 않는다.

| 항목 | 정확한 값 |
| --- | --- |
| 홈페이지 및 public client callback | `http://127.0.0.1:3003`, `http://127.0.0.1:3003/auth/company/callback` |
| 홈페이지 site ID | `exventure-website` |
| 중앙 issuer | `http://127.0.0.1:58421/auth/v1` |
| 중앙 accounts portal | `http://127.0.0.1:3002` |
| 홈페이지 Supabase Data API / DB 포트 | `http://127.0.0.1:58621` / `58622` |
| 홈페이지 / 중앙 로컬 project ID | `exventure-website-ui-qa` / `exventure-accounts-ui-qa` |

`WEBSITE_LOCAL_INTEGRATION_ENABLED=true`, `WEBSITE_INQUIRY_DB_ENVIRONMENT=local-test`, 위 두 정확한 `*_LOCAL_PROJECT_ID`, 고정 ORIGIN/DB_URL이 모두 필요하다. 공개 수집은 MODE=supabase로 별도 켜며, 준비 중 MODE=disabled에서도 관리자 설정은 가능하다. 인프라 담당자가 공급할 서버 전용 값은 `WEBSITE_INQUIRY_DB_SECRET_KEY`, 별도 `WEBSITE_INQUIRY_SIGNING_SECRET`(32자 이상), `WEBSITE_COMPANY_SESSION_KEY`(64자리 hex), test public-client ID인 `WEBSITE_COMPANY_OIDC_CLIENT_ID`, 허가된 가상 계정 UUID인 `WEBSITE_COMPANY_ADMIN_ACCOUNT_ID`다. SSO_ENABLED와 AUTH_PROVISIONED는 실제 local client/site/grant가 준비된 후 true로 설정한다. OAuth client secret은 요구하지 않는다. private env 파일은 git 밖에서만 전달한다.

VERCEL·VERCEL_ENV·VERCEL_URL·VERCEL_PROJECT_ID 중 하나라도 존재하면 빈 값이라도 local 모드가 차단된다. DB_ENVIRONMENT=production, 운영 public DB URL, 다른 스택/포트, localhost·외부 주소는 허용하지 않는다. test mode의 Supabase 저장은 실제 RPC 어댑터를 사용하며 SQLite 관리자 fixture나 `WEBSITE_INQUIRY_LOCAL_ADMIN_ROLE`은 OAuth를 대신할 수 없다. 공개 방문자는 OAuth 없이 테스트 문의를 접수할 수 있지만 관리자 세션은 실제 테스트 중앙 인증을 거쳐야 한다. 법적 미확정 사실은 local-synthetic 안내로 표시하며 운영 개인정보 승인으로 간주하지 않는다.

openid-client의 HTTP 허용 hook은 이 고정 로컬 issuer의 client에만 적용한다. discovery·token·JWKS 요청을 각각 `/auth/v1/.well-known/openid-configuration`, `/auth/v1/oauth/token`, `/auth/v1/.well-known/jwks.json`으로 제한하고 redirect를 거절한다. discovery의 issuer·authorization/token/JWKS 주소 및 ES256 지원도 검사한다. PKCE/ES256 서명/state/nonce/issuer/audience/만료와 매 요청 기존 홈페이지 권한 검사는 유지한다. HTTP local 모드의 쿠키만 Secure 속성을 생략하며 HttpOnly·SameSite=Lax·범위·기한·암호화는 유지한다. HTTPS 운영 쿠키는 Secure를 유지한다. [openid-client 로컬 HTTP hook](https://raw.githubusercontent.com/panva/openid-client/v6.8.8/docs/functions/allowInsecureRequests.md), [서명 검증](https://raw.githubusercontent.com/panva/openid-client/v6.8.8/docs/functions/enableNonRepudiationChecks.md).

브라우저와 실제 Host는 반드시 127.0.0.1:3003이다. Next가 내부 route URL을 localhost로 재구성한 경우만 실제 Host·HTTP·포트·Origin을 다시 검사한 뒤 127 콜백으로 정규화한다. browser localhost, 다른 포트, forwarded-host/proto로 경계를 바꾸는 요청은 거절한다. POST는 정확한 홈페이지 Origin과 same-origin fetch metadata·JSON도 요구한다. 실제 Supabase/Auth의 discovery·gateway·ES256 서명·권한 연동과 브라우저 흐름은 승인된 가상 로컬 환경에서 확인했다. 운영/Vercel의 활성화된 인증·접수 성공으로 대신 표시하지 않는다.

## 운영 활성화 후속 최소 조치

1. 중앙 계정에 exventure-website 전용 OAuth client/site를 등록하고, 운영 콜백 https://exventure-website.vercel.app/auth/company/callback을 정확히 지정한다. 테스트는 별도 고정 검토 URL·테스트 client와 계정을 사용한다. 기존 client·콜백·권한은 바꾸지 않는다.
2. 부모에게 전달한 정확한 회사 account ID에 홈페이지별 admin grant를 부여한다. 이는 새로운 문의 열람·완료 삭제·공개 연락처 수정 권한이므로 별도 승인 후 수행한다. 중앙 계정 관리자 권한이나 다른 업무 권한은 변경하지 않는다.
3. 서버 전용 session 암호화 key(64자리 hex)와 문의 HMAC key를 승인된 환경에 분리해 구성한다. 현재는 빈 설정 슬롯만 있다. 테스트에는 실행 중 생성한 ephemeral key만 사용한다. OAuth client secret을 새로 요구하지 않는다.
4. 두 migration과 실제 Auth/Data gateway 연결은 승인된 로컬 환경에서 검증했다. 별도 cloud Preview 환경에도 합성 데이터로 검증한 뒤 운영에는 검토한 두 migration만 적용한다. 운영 전체 DB push/reset은 하지 않는다. 운영 환경의 HTTPS·Vercel 요청 헤더·정확한 담당자 grant 연결은 활성화 전 별도 확인한다.

## 공동 로컬 통합 계획과 현재 호환성

부모가 공유한 공동 계획은 아래와 같다. 사용자가 로컬 DB 3개·가상 계정·테스트 OAuth/key/grant 생성 및 검증 후 중지·보존을 승인했고 UI 작업이 생성을 전담한다. 이 작업에서는 네트워크·DB·OAuth client·계정을 만들지 않았다. `localhost`와 혼용하지 않고 `127.0.0.1`을 canonical host로 사용한다.

| 대상 | 격리 project ID | API / DB | 앱 |
| --- | --- | --- | --- |
| accounts | exventure-accounts-ui-qa | 58421 / 58422 | 3002 |
| business | exventure-business-ui-qa | 58521 / 58522 | 3000 |
| website | exventure-website-ui-qa | 58621 / 58622 | 3003 |

홈페이지 site ID는 `exventure-website`, OAuth client는 public, 실제 callback은 `http://127.0.0.1:3003/auth/company/callback`, discovery에서 확인한 issuer는 `http://127.0.0.1:58421/auth/v1`, portal은 `http://127.0.0.1:3002`다. 별도 담당자가 공급한 비공개 env 파일로만 연결했다. PKCE·ES256·state/nonce·issuer/audience·사이트 권한 검증을 유지한 실제 브라우저 로그인과 요청을 확인했다. 이 작업은 accounts/workspace 코드를 수정하지 않았다.

공동 환경의 가상 계정에서 홈페이지 grant만 일시 회수·복원했다. 전역 계정 상태와 다른 사이트 grant는 유지했고, 중앙 DB의 변경 version은 자동 증가했다. 권한 회수 시 기존 홈페이지 session이 폐기되고, 복원해도 그 session은 살아나지 않으며 새 OAuth 로그인으로만 다시 접근된다. 테스트 계정·키·DB의 생성/중지·보존은 인프라 담당자 소유다.

## Preview 분리와 비용/권한 영향

읽기 전용 확인(2026-09-30 07:33 UTC): 홈페이지 NEXT_PUBLIC_SUPABASE_URL/PUBLISHABLE_KEY는 Production와 Preview에 같은 운영 ref yyoyeyvgpfybsjpgaouv를 공유한다. 홈페이지 public 테이블은 0개, 개발 브랜치는 0개였다. 운영 테스트에는 사용하지 않는다.

1. 빠른 코드/화면 검토는 지금처럼 로컬 SQLite + PGlite 합성 데이터로 가능하다. 추가 공급자 DB 비용이나 운영 권한 변경이 없다. 실제 Supabase Auth/Data API/다중 연결 검증은 대신하지 않는다.
2. 통합 검토에는 홈페이지 전용 데이터 없는 Supabase 개발 브랜치 또는 별도 검토 프로젝트 하나를 제안한다. 운영 행·Storage를 복사하지 않으며 합성 데이터만 seed한다. 브랜치는 독립 instance/credential을 갖고 기본적으로 운영 데이터 없이 생성된다. GitHub 자동 merge는 운영 migration을 적용할 수 있으므로 이번 검토에는 연결하지 않는다. [Supabase Branching](https://supabase.com/docs/guides/deployment/branching)
3. 승인 후 Preview에 붙은 기존 공개 DB 두 변수의 Preview target만 테스트 연결로 분리하고, 새 WEBSITE_INQUIRY_DB_* 서버 설정을 테스트에만 둔다. Production 값은 보존한다. 새 adapter는 계정/업무/운영 홈페이지 ref를 비운영에서 거절하며, Preview의 기존 공개 연결에 운영 ref가 남아 있으면 활성화하지 않는다.
4. 고정 검토 주소·Vercel 접근 보호·정확한 테스트 OAuth 콜백·허용된 시험 계정을 준비한다. Preview 보호와 robots/noindex는 DB 권한을 대신하지 않는다.

공식 가격 확인(2026-09-30): Pro 추가 프로젝트는 Micro 기준 월 USD 10부터이며 조직 compute credit/다른 사용량·세금에 따라 실제 추가분이 달라진다. [Supabase 가격](https://supabase.com/pricing). Micro Preview 브랜치는 USD 0.01344/시간부터이고 사용량이 더해진다. Branching compute에는 compute credit이 적용되지 않고 Spend Cap도 적용되지 않는다. [브랜치 과금](https://supabase.com/docs/guides/platform/manage-your-usage/branching). 실제 조직의 비용을 승인 전에 확인해야 한다. 여기서는 프로젝트/브랜치를 생성하거나 과금을 승인하지 않았다. site/grant 등록은 DB 사용량과 별개 권한 변경이며, 새로운 발송·CRM·파일 저장 비용은 추가하지 않는다.

## 보존과 실제 운영 활성화 전 남은 검증

완료 삭제·90일 만료 purge 함수와 로컬 동작을 합성 데이터로 검증했다. SQL의 purge_expired_website_inquiries는 명시 호출 또는 신규 접수 때 실행된다. 별도 관리자 실행 진입점은 POST `/api/admin/inquiries/purge`이며 fresh 홈페이지 admin + exact Origin + JSON `{ "action": "purge_expired" }`만 허용한다. caller가 날짜/보존 기간/대상 ID/전체 삭제를 지정할 수 없다. 기본 `WEBSITE_INQUIRY_PURGE_ENABLED=false`이며 실제 예약 job은 없다. 공개 원격 접수에는 관리자 인증 설정과 `WEBSITE_INQUIRY_RETENTION_OPERATIONS_APPROVED=true`까지 필요하다. 이 flag는 스케줄 생성이나 백업 삭제를 실행하지 않는다. idle 기간의 기한 파기/실패 감시/백업 처리 절차 확인 후에만 운영에서 켠다. UI는 자동 삭제가 이미 동작한다고 약속하지 않는다.

안전한 실행/실패 기록 절차:

1. 승인된 테스트 환경에서만 purge를 켜고 현재 권한이 있는 홈페이지 관리자 세션으로 same-origin POST를 실행한다. 서버는 UUID 실행번호와 actor ID, 시작시각을 먼저 기록한다. 시작 기록 저장에 실패하면 삭제 RPC를 호출하지 않는다.
2. DB clock 기준으로 만료 문의·rate limit·90일 지난 연락처 변경 이력·만료 세션만 삭제한다. 한 transaction에서 삭제 수와 성공 상태를 함께 기록한다. 삭제 오류는 모든 삭제를 rollback하고 `database_failure`만 기록한다. 원문 SQL 오류·문의 내용·이메일·토큰·key는 실행/실패 로그에 넣지 않는다.
3. 완료한 실행번호 재실행은 저장된 결과만 돌려준다. 통신 timeout은 commit 여부를 추정하지 않고 `outcome_unknown`/503과 실행번호만 반환한다. 자동 재시도하거나 새 실행번호로 재요청하지 않는다.
4. 승인된 DB 관리자가 `website_private.maintenance_runs`에서 해당 run_id의 state/result/started_at/finished_at을 읽는다. succeeded면 저장된 counts를 확인하고 failed면 원인을 별도 안전한 진단으로 수정한다. started 또는 기록을 읽을 수 없는 상태에서는 진행 중 transaction 여부를 확인하기 전 삭제를 재실행하지 않는다. 같은 run_id의 DB 함수는 row lock으로 중복 실행을 막고 완료 결과를 재사용한다. 실제 DB에서 재실행/수동 수정은 별도 승인 대상이다.
5. 완료한 실행 이력은 이후 purge에서 90일 기준으로 정리한다. 미확인 started 기록은 먼저 결과를 조사한다. 실제 scheduler credential·권한·주기·실패 알림 수신·백업 복원 후 재파기 절차는 이번 작업에서 구성하지 않았다.

레코드 삭제가 PostgreSQL 페이지/WAL, Supabase 백업, 외부 복제/별도 사본의 즉시 완전 삭제를 뜻하지 않는다. 백업 보존·복원 시 삭제 대상 재적용·실제 복구 검증은 수행하지 않았다. 운영 접수 전에 공급자 처리 범위와 이 절차를 확정해야 한다. 일반 잠재고객 문의를 일괄 법정 3년 보관으로 처리하지 않는다.

PGlite는 PostgreSQL SQL·RLS/권한·RPC 트랜잭션과 90일 만료 문의 파기를 실행하며, Node SQLite 검증은 파일 재열기와 실 로컬 API 흐름을 확인한다. HTTPS customFetch fixture의 ES256/JWKS 검증과 실제 127 QA 스택의 Supabase gateway·동시 PostgreSQL RPC·중앙 OAuth 브라우저 검증은 구분한다. 실제 HTTP purge는 만료된 가상 암호화 session을 삭제하면서 미만료 문의를 보존했다. 운영 Vercel의 활성화된 인증/접수·예약 파기·백업 복원은 미검증이며 수행하지 않았다.

## 완료한 로컬 검증 · 2026-09-30

- `npm run check`: 합성 데이터 테스트 96개 통과, 실패/skip 0개. 기존 문의/SQL·인증·purge/개인정보 69개에 loopback OAuth 19개, local 환경/Origin/저장/삭제 경계 6개, 실제 PostgREST의 void RPC 204 계약 2개를 추가했다. Vercel 표식의 빈 값·preview·production, 운영 DB 환경, localhost/다른 포트·외부 URL·운영 ref, metadata/redirect, PKCE·ES256·state/nonce/issuer/audience/권한 회수를 검사했다. 타입 검사와 프로덕션 빌드도 통과했다. 최종 로그는 ignored `output/playwright/actual-browser-regression-check.log`다.
- 승인된 실제 홈페이지 QA Data API 검증 35개를 통과했다. 동일 요청 12건 동시 호출은 접수번호/행 하나, IP 7건 동시 호출은 저장 5/제한 2, 이메일 5건 동시 호출은 저장 3/제한 2였다. anon은 401, 유효한 authenticated fixture JWT는 403으로 보호 RPC 실행을 거절하며 모두 SQL 권한 오류 42501이었다. 실제 문의 조회·완료 삭제·선택 미동의 회사명 누락·연락처 변경/버전 충돌/이력·암호화 session 저장/기한·purge 및 같은 run 결과 재사용을 확인했다. 실제 void RPC는 빈 204 응답을 반환하므로 session 저장/삭제/purge 시작 3개 호출에서만 허용하도록 어댑터를 수정했다. JSON을 반환해야 하는 조회/접수/설정/purge 결과의 빈 응답은 계속 오류다. 증거: ignored `output/playwright/actual-stack-rpc-verification.json`.
- 서버 handler와 실제 Data API를 연결한 15개 검사도 통과했다. 요청 객체/관리자 context는 fixture이며 홈페이지 HTTP·OAuth 브라우저 성공을 뜻하지 않는다. 정확 Origin·미동의 회사명 누락·연락처 변경 후 이전 동의 token 차단·무권한 설정/삭제 거절·허용된 fixture 완료 삭제를 확인했다. 실제 중앙 Auth의 가상 계정 password 로그인은 성공하고 OAuth client_id가 없는 일반 token은 portal identity에서 401로 차단된다. 증거: ignored `output/playwright/actual-handler-verification.json`.
- 실제 중앙 OAuth 로그인 4개 검사와 복원 후 새 로그인 3개 검사가 통과했다. 홈페이지 grant 회수 차단 8개, 복원 후 폐기 session 재사용 차단 1개도 통과했다. 공통 가상 계정의 전역 상태·다른 사이트 권한은 변경하지 않았다. 증거: ignored `actual-oauth-login-verification.json`, `actual-oauth-relogin-verification.json`, `actual-oauth-revocation-verification.json`, `actual-oauth-restored-verification.json`.
- 실제 익명 브라우저 접수→OAuth 관리자 목록→완료 삭제, 미동의 회사명 누락, 연락처 검증/변경/이력/폼·안내 반영과 이전 동의 token 차단은 31개 검사로 확인했다. 접수 완료와 오류 요약의 DOM 생성 후 포커스 이동도 확인했다. 390px 자동 접근성 5개 상태에서 위반/보류 0개, 가로 넘침·JS runtime 오류·외부 origin 요청 0개였다. 증거: ignored `output/playwright/actual-oauth-flow-verification.json`.
- purge 기본 off는 실제 OAuth 관리자에게도 503이다. 별도 테스트 프로세스에서만 켠 HTTP purge는 12개 검사를 통과했다. 익명 403, 임의 action/cutoff 400, 실행 성공/DB clock·no-store, 만료 session 1건 삭제와 미만료 문의 보존, 가상 문의 정리 및 실제 logout 후 목록/purge 차단을 확인했다. 실행 seed 3개 검사와 결과는 ignored `actual-http-purge-seed-verification.json`, `actual-http-purge-verification.json`이다. 공급한 env 파일·운영 설정·예약 실행은 바꾸지 않았다.
- Vercel production 표식·접수 disabled 기본값으로 실행한 로컬 빌드의 27개 브라우저 검사도 통과했다. 접수 폼/가상 안내/시험 주소/로그인 action 없이 준비 안내를 표시하고 API/OAuth/admin은 정해진 503/403 및 no-store로 차단된다. 390px 자동 접근성 3개 상태 위반/보류·넘침·JS runtime 오류·외부 요청은 0개다. 증거: ignored `output/playwright/production-blocked-browser-verification.json`. 실제 Vercel 게시 후의 요청은 별도 확인한다.
- 새 로그인/인증 오류/무권한 목록·설정 화면의 이전 Chrome 검사 30개와 axe 자동 검사 4개 상태도 통과했다. 설정 누락 시 OAuth start/callback/logout은 503, 관리자 변경/purge는 403이며 모두 no-store다. 의도한 거절 응답의 resource 오류는 JS runtime 오류와 구분했다.
- 프로덕션 빌드를 loopback 127.0.0.1:3127에서 실행해 25개 브라우저 검사를 통과했다. 빈 연락처일 때 접수 차단, 동의 기본 미선택, 접수번호/오류 요약의 포커스, 저장 실패 시 입력 유지, 실제 로컬 저장 후 관리자 조회·완료 삭제, 미동의 회사명 누락·선택 동의 철회, 연락처 변경 이력과 폼/안내 반영을 확인했다. 저장 실패 UI는 명시적 503 fixture이며 서버 저장 실패·롤백은 Node/PGlite 테스트로 별도 검증했다.
- axe-core 4.13.0으로 문의 폼·오류·완료, 관리자 목록·설정, 개인정보 안내의 6개 상태를 검사했다. WCAG 2 A/AA·2.1 AA 및 best-practice 탐지 위반/보류는 모두 0개였다. 이는 자동 검사 범위의 결과이며 전체 접근성 인증을 뜻하지 않는다.
- 문의 화면 320/390/1440px, 설정 화면 390px에서 가로 넘침이 없었다. 실제 직원/고객/업무 정보나 운영 세션은 사용하지 않았다. 실제 중앙 로그인 검증에는 승인된 가상 로컬 계정만 사용했다.
- 가상 예시 캡처와 JSON 결과는 ignored `output/playwright/`에 있다. 로컬 통합과 운영 접수 활성화를 구분하며, 별도 인프라 생성·운영 계정 권한 부여·키 생성·운영 DB 삭제는 실행하지 않았다.
