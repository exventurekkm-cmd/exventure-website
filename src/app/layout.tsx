import type { Metadata } from "next";
import "@/styles/exventure.css";
import "./globals.css";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "엑스벤처 | EXVENTURE",
  description: "기업 진단과 소비자 반응조사를 바탕으로 우선순위와 분기별 실행 계획을 연결합니다.",
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
