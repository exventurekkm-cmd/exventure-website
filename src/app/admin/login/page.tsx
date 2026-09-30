import Link from "next/link";
import { readCompanyConfig } from "@/lib/company/config";
import "@/styles/contact.css";
export const dynamic = "force-dynamic";
const messages: Record<string, string> = {
  invalid: "로그인 응답을 확인하지 못했습니다. 로그인을 다시 시작해주세요.",
  denied: "홈페이지 관리자 권한을 확인하지 못했습니다.",
  unavailable: "인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.",
};
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ status?: string | string[] }> }) {
  const config = readCompanyConfig(process.env), status = (await searchParams).status;
  const message = typeof status === "string" ? messages[status] : undefined;
  return <main id="main" tabIndex={-1} className="section-page"><p className="editorial-label">WEBSITE ADMIN</p><h1>홈페이지 관리자 로그인</h1><p className="lead">회사 계정으로 로그인하고 홈페이지 관리자 권한을 확인합니다.</p>{message && <p role="alert" className="contact-test-notice">{message}</p>}{config ? <a className="editorial-link" href="/auth/company/start">회사 계정으로 로그인 <span aria-hidden="true">↗</span></a> : <p>중앙 인증과 홈페이지 관리자 연결을 준비하고 있습니다.</p>}<div className="section-actions"><Link className="text-link" href="/">홈으로</Link></div></main>;
}
