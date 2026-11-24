import Link from "next/link";
import { PageHeading } from "@/components/explore-parts";
import { InquiryForm } from "@/components/inquiry-form";
import { EmailInquiry } from "@/components/email-inquiry";
import { inquirySettings } from "@/lib/inquiries/runtime";
import { isTestInquiry, readInquirySettings } from "@/lib/inquiries/settings";
import { issueInquiryToken } from "@/lib/inquiries/tokens";
import { companyProfile as company } from "@/lib/company-profile";
import { findInterest } from "@/lib/explore";
import "@/styles/contact.css";

export const metadata = { title: "프로젝트 문의", description: "기업 진단·사업화 지원, 시장 검증, 기관 협업에 관해 문의하세요." };
export const dynamic = "force-dynamic";
export default async function ContactPage({ searchParams }: { searchParams: Promise<{ interest?: string | string[] }> }) {
  const [settings, params] = await Promise.all([inquirySettings(), searchParams]);
  const initialInterest = findInterest(params.interest)?.id;
  const base = readInquirySettings(process.env);
  const testOnly = base.enabled && isTestInquiry(base.settings);
  return <main id="main" tabIndex={-1}><PageHeading title="프로젝트 문의" intro="필요한 지원과 참여 대상, 희망 일정을 알려주세요." />
    <div className="wrap content-space form-layout contact-layout">
      <aside className="form-rail"><h2>회사 연락처</h2><address className="contact-details">
        <div><span>이메일</span><a href={"mailto:" + company.email}>{company.email}</a></div>
        <div><span>전화</span><a href={company.telephoneHref}>{company.telephone}</a></div>
        <div><span>주소</span><p>{company.address}</p></div>
      </address></aside>
      <div className="form-surface">
        {testOnly && <div className="contact-test-notice" role="status"><strong>개발 확인용 화면입니다.</strong><span>이 컴퓨터의 테스트 저장소에는 가상 데이터를 입력해주세요.</span><Link href="/admin/inquiries">테스트 관리자 화면</Link></div>}
        {settings ? <><h2>문의 내용 작성</h2><InquiryForm key={initialInterest ?? ""} initialInterest={initialInterest} policy={settings.policy}
          token={issueInquiryToken(settings.secret, settings.policy)} testOnly={isTestInquiry(settings)} /></>
          : <EmailInquiry key={initialInterest ?? ""} recipient={company.email} initialInterest={initialInterest} />}
        <p className="privacy-link"><Link href="/privacy">문의 개인정보 안내</Link></p>
      </div>
    </div></main>;
}
