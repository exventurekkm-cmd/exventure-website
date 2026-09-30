import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "@/components/inquiry-form";
import { inquirySettings } from "@/lib/inquiries/runtime";
import { isTestInquiry, readInquirySettings } from "@/lib/inquiries/settings";
import { issueInquiryToken } from "@/lib/inquiries/tokens";
import "@/styles/contact.css";

export const metadata: Metadata = { title: "문의 | 엑스벤처", description: "기업 진단·사업화 지원, 시장검증, 기관 협업에 관한 문의를 남겨주세요." };
export const dynamic = "force-dynamic";
export default async function ContactPage() {
  const settings = await inquirySettings(), base = readInquirySettings(process.env);
  const testOnly = base.enabled && isTestInquiry(base.settings);
  return <main id="main" tabIndex={-1} className="contact-page">
    <header className="contact-opening"><div><p className="editorial-label">CONTACT EXVENTURE</p><h1>다음 단계를,<br />함께 이야기해요.</h1><p className="contact-lead">지금 마주한 질문과 필요한 지원을 알려주세요.<br />함께할 수 있는 방향을 살펴보겠습니다.</p></div><div className="contact-opening-note"><p className="editorial-label">A QUESTION IS A START</p><p>기업 진단·사업화 지원<br />시장검증·소비자 반응조사<br />기관 협업·프로그램</p><span className="contact-hint">로그인 없이 문의할 수 있습니다.</span></div></header>
    {testOnly && <div className="contact-test-notice" role="status"><strong>개발 확인용 화면입니다.</strong><span>실제 개인정보 대신 가상 데이터를 입력해주세요. 이 컴퓨터의 테스트 저장소만 사용합니다.</span><Link href="/admin/inquiries">테스트 관리자 화면 ↗</Link></div>}
    <div className="contact-content"><div>{settings ? <InquiryForm policy={settings.policy} token={issueInquiryToken(settings.secret, settings.policy)} testOnly={isTestInquiry(settings)} /> : <section className="contact-unavailable" aria-labelledby="contact-unavailable-title"><p className="editorial-label">GETTING READY</p><h2 id="contact-unavailable-title">문의 접수를 준비하고 있습니다.</h2><p>접수에 필요한 연락처와 개인정보 안내를 확인하고 있습니다. 준비가 끝나면 이 화면에서 문의를 남길 수 있습니다.</p><Link className="editorial-link" href="/">홈으로 돌아가기 <span aria-hidden="true">↗</span></Link></section>}</div><aside className="contact-aside" aria-labelledby="contact-guide"><p className="editorial-label">BEFORE YOU SEND</p><h2 id="contact-guide">작성 전에</h2><ol><li><span aria-hidden="true">01</span><div><h3>답변받을 주소</h3><p>회신 이메일을 한 번 더 확인해주세요.</p></div></li><li><span aria-hidden="true">02</span><div><h3>풀고 싶은 질문</h3><p>현재 상황과 필요한 지원을 알려주세요. 첨부파일은 받지 않습니다.</p></div></li><li><span aria-hidden="true">03</span><div><h3>필요한 정보만</h3><p>민감정보와 타인의 개인정보를 적지 마세요. 회사·기관명은 선택입니다.</p></div></li></ol><Link href="/privacy" className="editorial-link">개인정보 안내 <span aria-hidden="true">↗</span></Link></aside></div>
  </main>;
}
