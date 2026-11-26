import type { Metadata } from "next";
import Link from "next/link";
import { PublicShare } from "@/components/public-share";
import { SiteHeader, SkipLink } from "@/components/site-header";
import { AccountLink, EmployeeSession } from "@/components/employee-account";
import { Brand } from "@/components/brand";
import { companyProfile as company } from "@/lib/company-profile";
import "@/styles/exventure.css";
import "@/styles/editorial-fonts.css";
import "@/styles/explore.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://exventure.co.kr"),
  title: { default: "엑스벤처 | 창업·사업화 프로그램", template: "%s | 엑스벤처" },
  description: "엑스벤처의 창업 교육과 팀빌딩, 제품·시장 검증, 해외 진출 프로그램을 살펴보세요.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body><EmployeeSession>
    <SkipLink /><SiteHeader />{children}
    <footer className="foot"><div className="wrap foot-row">
      <div><Link className="wordmark" href="/" aria-label="엑스벤처 홈"><Brand tone="dark" /></Link><p>{company.name}</p></div>
      <address><a href={"mailto:" + company.email}>{company.email}</a><a href={company.telephoneHref}>{company.telephone}</a></address>
      <nav aria-label="하단 메뉴"><Link href="/about#company-history">연혁</Link><Link href="/privacy">문의 개인정보 안내</Link><AccountLink /><PublicShare /></nav>
    </div></footer>
  </EmployeeSession></body></html>;
}
