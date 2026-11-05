export const accountUrl = "/login";
export const navigation = [
  { href: "/about", label: "회사 소개" },
  { href: "/business", label: "사업 영역" },
  { href: "/tools", label: "창업지원 도구" },
  { href: "/news", label: "소식" },
  { href: "/contact", label: "문의" },
] as const;
// Verified content can be supplied by the CMS later without changing routes.
export const sections = {
  about: { eyebrow: "ABOUT EXVENTURE", title: "창업의 가능성을, 지속 가능한 성장으로.", description: "창업 교육과 컨설팅, 맞춤형 멘토링을 통해 초기 기업의 실행 가능한 계획과 다음 성장을 함께 만듭니다." },
  business: { eyebrow: "WHAT WE DO", title: "기업의 다음 단계를 함께.", description: "기업 발굴과 창업 교육부터 MVP 제작 지원, 시장 검증과 IR, 해외 진출 준비까지 기업의 성장 단계에 맞춰 연결합니다." },
  tools: { eyebrow: "STARTUP TOOLS", title: "생각을 정리하고, 실행으로.", description: "사업계획과 시장조사에 필요한 질문을 정리하고, 작성한 내용을 문서로 활용하세요." },
  news: { eyebrow: "NEWS & STORIES", title: "엑스벤처의 소식.", description: "공개할 소식과 활동을 준비하고 있습니다." },
} as const;
