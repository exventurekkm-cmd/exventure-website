import type { Metadata } from "next";
import "@/styles/exventure.css";
import "./globals.css";
import "@/styles/industrial-site.css";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "엑스벤처 | EXVENTURE",
  description: "창업 교육과 컨설팅, 시장 검증과 IR 준비, 글로벌 진출 지원으로 초기 기업의 성장을 함께하는 엑스벤처입니다.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>
    <a className="skip-link" href="#main">본문으로 이동</a>
    <SiteHeader />
    {children}
    <footer className="site-footer">
      <Link className="site-brand" href="/" aria-label="엑스벤처 홈페이지"><Brand /></Link>
      <p>질문에서 근거로, 근거에서 실행으로.</p><span>공식 홈페이지 준비 중</span>
    </footer>
  </body></html>;
}
