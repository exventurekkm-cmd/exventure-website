import Link from "next/link";
import { inquiryAdminContext } from "@/lib/inquiries/admin-runtime";
import { PrivacyContactForm } from "@/components/privacy-contact-form";
import { CompanyLogoutButton } from "@/components/company-logout-button";
import "@/styles/contact.css";
export const dynamic = "force-dynamic";
export default async function InquirySettingsPage() {
  let context = null;
  try { context = await inquiryAdminContext(); } catch { /* Deny on failure. */ }
  if (!context) return <main id="main" tabIndex={-1} className="section-page"><p className="editorial-label">WEBSITE ADMIN</p><h1>홈페이지 관리자 권한이 필요합니다.</h1><p className="lead">홈페이지에 허용된 관리자만 설정을 변경할 수 있습니다.</p><Link className="editorial-link" href="/admin/login">관리자 로그인 <span aria-hidden="true">↗</span></Link></main>;
  let setting, history;
  try { [setting, history] = await Promise.all([context.store.privacySetting(), context.store.privacyHistory()]); }
  catch { return <main id="main" tabIndex={-1} className="section-page"><h1>개인정보 연락처 설정</h1><p role="alert">설정을 불러오지 못했습니다. 잠시 후 새로고침해주세요.</p></main>; }
  return <main id="main" tabIndex={-1} className="section-page"><p className="editorial-label">PRIVACY CONTACT</p><h1>개인정보 연락처 설정</h1>
    {context.testOnly && <div className="contact-test-notice"><strong>로컬 가상 관리자</strong><span>연락처는 테스트 설정에만 저장합니다. 운영 홈페이지는 변경하지 않습니다.</span></div>}
    <PrivacyContactForm initial={setting} /><h2>변경 이력</h2>{history.length === 0 ? <p>저장된 변경 이력이 없습니다.</p> : <ol className="contact-settings-history">{history.map(event => <li key={event.version}>{event.createdAt.slice(0, 19).replace("T", " ")} UTC · {event.previousEmail || "미설정"} → {event.email} · 버전 {event.version} · 변경자: {context.testOnly ? "테스트 관리자" : "홈페이지 관리자"}</li>)}</ol>}
    <div className="section-actions"><Link className="editorial-link" href="/admin/inquiries">문의 목록 <span aria-hidden="true">↗</span></Link>{(!context.testOnly || context.localIntegration) && <CompanyLogoutButton />}</div>
  </main>;
}
