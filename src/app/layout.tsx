import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { accountUrl, navigation } from "@/lib/site";

export const metadata: Metadata = {
  title: "엑스벤처 | EXVENTURE",
  description: "엑스벤처의 회사·사업 소개와 소식, 도구와 서비스 안내",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body><a className="skip-link" href="#main">본문으로 이동</a><header className="site-header"><Link className="brand" href="/">EXVENTURE<span>엑스벤처</span></Link><nav aria-label="주 메뉴">{navigation.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav><a className="account-link" href={accountUrl}>로그인 · 내 서비스 ↗</a></header>{children}<footer className="site-footer"><Link className="brand" href="/">EXVENTURE</Link><p>기업의 다음 단계를 함께.</p><span>공식 홈페이지 준비 중</span></footer></body></html>;
}
