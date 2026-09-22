import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "엑스벤처 | EXVENTURE",
  description: "엑스벤처 홈페이지를 준비하고 있습니다.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko"><body>{children}</body></html>;
}
