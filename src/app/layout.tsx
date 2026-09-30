import type { Metadata } from "next";
import "@/styles/exventure.css";
import "./globals.css";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "엑스벤처 | EXVENTURE",
  description: "엑스벤처의 회사·사업 소개와 소식, 도구와 서비스 안내",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>
    <a className="skip-link" href="#main">본문으로 이동</a>
    <SiteHeader />
    {children}
    <footer className="site-footer">
      <Link className="site-brand" href="/" aria-label="엑스벤처 홈페이지"><Brand /></Link>
      <p>기업의 다음 단계를 함께.</p><span>공식 홈페이지 준비 중</span>
    </footer>
  </body></html>;
}
