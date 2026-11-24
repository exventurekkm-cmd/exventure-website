import Link from "next/link";
import { PageHeading } from "@/components/explore-parts";
import { companyProfile } from "@/lib/company-profile";
import { inquirySettings } from "@/lib/inquiries/runtime";
import { isTestInquiry } from "@/lib/inquiries/settings";
import "@/styles/contact.css";

export const metadata = { title: "문의 개인정보 안내" };
export const dynamic = "force-dynamic";
export default async function PrivacyPage() {
  const settings = await inquirySettings();
  const details = settings?.privacyDetails;
  return <main id="main" tabIndex={-1}><PageHeading title="문의 개인정보 안내" />
    <div className="wrap content-space reading-copy">{settings ? <>
      <p>{settings.policy.controller}의 문의 접수 안내입니다.</p>
      {isTestInquiry(settings) && <div className="contact-test-notice"><strong>가상 데이터 검증용 안내</strong><span>운영용 처리방침은 처리 주체·서비스 제공자·처리 국가 등의 확인을 마친 뒤 공개합니다.</span></div>}
      <dl className="contact-policy">
        <div><dt>목적</dt><dd>{settings.policy.purpose}</dd></div>
        <div><dt>필수 항목</dt><dd>이름(실명 인증 없음), 회신 이메일, 문의 종류, 문의 내용</dd></div>
        <div><dt>선택 항목</dt><dd>회사·기관명. 별도 선택 동의가 있을 때만 수집하며 동의하지 않아도 문의할 수 있습니다.</dd></div>
        <div><dt>보유 기간</dt><dd>문의 처리 완료까지이며, 미종결 문의도 접수일부터 최대 {settings.policy.retentionDays}일입니다. 처리 완료 또는 기간 만료 시 파기하는 기준입니다.</dd></div>
        <div><dt>동의 거부</dt><dd>필수 항목 수집·이용 동의를 거부할 수 있으며, 거부하면 이 폼을 통한 접수가 어렵습니다.</dd></div>
        <div><dt>삭제 요청 연락처</dt><dd><a href={"mailto:" + settings.policy.contact}>{settings.policy.contact}</a></dd></div>
        <div><dt>접수·동의 기록</dt><dd>접수번호·접수시각과 동의한 안내 버전을 함께 기록합니다. 스팸 방지를 위한 해시 접속·회신주소 식별값은 최대 1시간 보관합니다.</dd></div>
      </dl>
      {details && <><h2>처리 위탁·처리 국가</h2><ul>{details.processors.map((processor,index) => <li key={index}>{processor.name} · {processor.purpose} · 처리 항목 {processor.dataItems} · 국가 {processor.countries.join(", ")} · 보유 기준 {processor.retention}</li>)}</ul>
        <h2>개인정보 연락 담당</h2><p>{details.privacyContactRole}</p><h2>국외 이전 안내</h2><p>{details.internationalTransfer.approvedNotice}</p></>}
      <p className="contact-hint">민감정보·주민등록번호·타인의 개인정보를 본문에 입력하지 마세요. 문의 폼에서 필수 항목과 선택 항목의 수집·이용 동의를 구분합니다.</p>
    </> : <>
      <h2>이메일 문의</h2><p>문의 초안은 브라우저에서 작성합니다. 이메일 앱에서 전송하면 작성한 내용과 발신 이메일 주소가 엑스벤처에 전달됩니다.</p>
      <p>개인정보에 관한 문의는 <a className="quiet-link" href={"mailto:" + companyProfile.email}>{companyProfile.email}</a>로 보내주세요.</p>
    </>}<Link href="/contact" className="secondary">문의 화면으로</Link></div>
  </main>;
}
