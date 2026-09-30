import Link from "next/link";
import { inquiryAdminContext } from "@/lib/inquiries/admin-runtime";
import { inquiryKinds } from "@/lib/inquiries/contract";
import { CompleteInquiryButton } from "@/components/complete-inquiry-button";
import { CompanyLogoutButton } from "@/components/company-logout-button";
import "@/styles/contact.css";
export const dynamic = "force-dynamic";
export default async function AdminInquiriesPage() {
  let context = null;
  try { context = await inquiryAdminContext(); } catch { /* Deny on failure. */ }
  if (!context) return <main id="main" tabIndex={-1} className="section-page"><p className="editorial-label">WEBSITE ADMIN</p><h1>홈페이지 관리자 권한이 필요합니다.</h1><p className="lead">홈페이지에 허용된 관리자만 문의를 확인하고 설정을 변경할 수 있습니다.</p><Link href="/admin/login" className="editorial-link">관리자 로그인 <span aria-hidden="true">↗</span></Link></main>;
  let inquiries;
  try { inquiries = await context.store.list(); }
  catch { return <main id="main" tabIndex={-1} className="section-page"><h1>접수한 문의</h1><p role="alert">문의 목록을 불러오지 못했습니다. 잠시 후 새로고침해주세요.</p></main>; }
  return <main id="main" tabIndex={-1} className="section-page">
    <p className="editorial-label">INQUIRY DESK</p><h1>접수한 문의</h1>
    {context.testOnly && <div className="contact-test-notice"><strong>로컬 가상 관리자</strong><span>실제 계정이나 운영 권한으로 로그인한 화면이 아닙니다. 최근 50건의 테스트 문의만 표시합니다.</span></div>}
    <div className="section-actions"><Link href="/admin/inquiries/settings" className="editorial-link">개인정보 연락처 설정 <span aria-hidden="true">↗</span></Link><Link href="/contact" className="text-link">문의 화면 보기</Link>{(!context.testOnly || context.localIntegration) && <CompanyLogoutButton />}</div>
    {inquiries.length === 0 ? <p>{context.testOnly ? "접수된 테스트 문의가 없습니다." : "접수된 문의가 없습니다."}</p> : <ul className="inquiry-admin-list">{inquiries.map(inquiry => <li key={inquiry.reference}><p className="editorial-label">{inquiry.reference}</p><h2>{inquiryKinds.find(kind => kind.value === inquiry.kind)?.label ?? inquiry.kind}</h2><dl className="contact-policy"><div><dt>이름</dt><dd>{inquiry.name}</dd></div><div><dt>회신 이메일</dt><dd>{inquiry.email}</dd></div><div><dt>회사·기관</dt><dd>{inquiry.organization || "수집하지 않음"}</dd></div><div><dt>접수일</dt><dd>{new Date(inquiry.createdAt).toISOString().slice(0, 10)} (UTC)</dd></div><div><dt>문의 내용</dt><dd className="inquiry-message">{inquiry.message}</dd></div></dl><CompleteInquiryButton reference={inquiry.reference} /></li>)}</ul>}
  </main>;
}
