export const accountUrl = "https://exventure-accounts.vercel.app/accounts";
export const navigation = [
  { href: "/about", label: "회사 소개" },
  { href: "/business", label: "사업 영역" },
  { href: "/tools", label: "AI 도구" },
  { href: "/news", label: "소식" },
  { href: "/contact", label: "문의" },
] as const;
// Verified content can be supplied by the CMS later without changing routes.
export const sections = {
  about: { eyebrow: "ABOUT EXVENTURE", title: "엑스벤처를 소개합니다.", description: "회사 소개와 함께하는 사람들의 이야기를 준비하고 있습니다." },
  business: { eyebrow: "WHAT WE DO", title: "기업의 다음 단계를 함께.", description: "사업 영역과 지원 프로그램을 정리하고 있습니다. 상세 내용은 준비되는 대로 안내하겠습니다." },
  tools: { eyebrow: "AI TOOLS", title: "더 나은 업무를 위한 도구.", description: "AI 도구의 소개와 이용 안내를 준비하고 있습니다. 직원용 업무 기능은 로그인 후 내 서비스에서 이용할 수 있습니다." },
  news: { eyebrow: "NEWS & STORIES", title: "엑스벤처의 소식.", description: "공개할 소식과 활동을 준비하고 있습니다." },
} as const;
