import Link from "next/link";
import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry-form";
import { EmailInquiry } from "@/components/email-inquiry";
import { inquirySettings } from "@/lib/inquiries/runtime";
import { isTestInquiry, readInquirySettings } from "@/lib/inquiries/settings";
import { issueInquiryToken } from "@/lib/inquiries/tokens";
import { companyProfile } from "@/lib/company-profile";
import "@/styles/contact.css";

export const metadata: Metadata = { title: "문의 | 엑스벤처", description: "기업 진단·사업화 지원, 시장검증, 기관 협업에 관한 문의를 남겨주세요." };
export const dynamic = "force-dynamic";
export default async function ContactPage() {
  const settings = await inquirySettings(), base = readInquirySettings(process.env);
  const testOnly = base.enabled && isTestInquiry(base.settings);
  return <main id="main" tabIndex={-1} className="contact-page">
    <header className="contact-opening"><div><p className="editorial-label">CONTACT EXVENTURE</p><h1>다음 단계를,<br />함께 이야기해요.</h1><p className="contact-lead">지금 마주한 질문과 필요한 지원을 알려주세요.<br />함께할 수 있는 방향을 살펴보겠습니다.</p></div><div className="contact-opening-note"><p className="editorial-label">A QUESTION IS A START</p><p>기업 진단·사업화 지원<br />시장검증·소비자 반응조사<br />기관 협업·프로그램</p><span className="contact-hint">로그인 없이 문의할 수 있습니다.</span></div></header>
    <section className="company-contact" aria-labelledby="company-contact-title"><div><p className="editorial-label">CONTACT DETAILS</p><h2 id="company-contact-title">엑스벤처와 연결하기</h2><p className="contact-hint">{companyProfile.sourceLabel}</p></div><address><div><span>이메일</span><a href={`mailto:${companyProfile.email}`}>{companyProfile.email}</a></div><div><span>전화</span><a href={companyProfile.telephoneHref}>{companyProfile.telephone}</a></div><div><span>주소</span><p>{companyProfile.address}</p></div></address></section>
    {testOnly && <div className="contact-test-notice" role="status"><strong>개발 확인용 화면입니다.</strong><span>실제 개인정보 대신 가상 데이터를 입력해주세요. 이 컴퓨터의 테스트 저장소만 사용합니다.</span><Link href="/admin/inquiries">테스트 관리자 화면</Link></div>}
    <div className="contact-content"><div>{settings ? <InquiryForm policy={settings.policy} token={issueInquiryToken(settings.secret, settings.policy)} testOnly={isTestInquiry(settings)} /> : <EmailInquiry recipient={companyProfile.email} />}</div><aside className="contact-aside" aria-labelledby="contact-guide"><p className="editorial-label">BEFORE YOU SEND</p><h2 id="contact-guide">작성 전에</h2><ol><li><span aria-hidden="true">01</span><div><h3>답변받을 주소</h3><p>{settings ? "회신 이메일을 한 번 더 확인해주세요." : "답변받을 수 있는 이메일 계정에서 보내주세요."}</p></div></li><li><span aria-hidden="true">02</span><div><h3>풀고 싶은 질문</h3><p>현재 상황과 필요한 지원, 희망 일정을 알려주세요.</p></div></li><li><span aria-hidden="true">03</span><div><h3>필요한 정보만</h3><p>민감정보와 타인의 개인정보를 적지 마세요.</p></div></li></ol><Link href="/privacy" className="editorial-link">개인정보 안내 </Link></aside></div>
  </main>;
}
