import type { Metadata } from "next";
import "@/styles/exventure.css";
import "./globals.css";
import "@/styles/industrial-site.css";
import "@/styles/history-directory.css";
import "@/styles/reference-site.css";
import "@/styles/public-frame.css";
import "@/styles/editorial-fonts.css";
import "@/styles/editorial-site.css";
import { SiteHeader, SkipLink } from "@/components/site-header";
import { ContentDirectory, CompanyContext } from "@/components/public-frame";

export const metadata: Metadata = {
  title: "엑스벤처 | EXVENTURE",
  description: "창업 교육과 컨설팅, 시장 검증과 IR 준비, 글로벌 진출 지원으로 초기 기업의 성장을 함께하는 엑스벤처입니다.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body className="public-frame-site editorial-site">
    <SkipLink />
    <SiteHeader />
    <div className="reference-shell">
    <div className="public-frame-grid"><ContentDirectory /><div className="frame-content">{children}</div><CompanyContext /></div>
    <footer className="site-footer">
      <p>© 주식회사 엑스벤처</p><a href="/privacy">개인정보 안내</a>
    </footer>
    </div>
  </body></html>;
}
