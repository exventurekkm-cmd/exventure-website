/** Editorial source: supplied company introduction, January 2026, pp. 3-4, 6-8, 13. */
export const companyProfile = {
  name: "주식회사 엑스벤처",
  englishName: "Exventure Inc.",
  representative: "이진태",
  established: "2023. 11. 03.",
  address: "경기도 수원시 팔달구 행궁로 98, 403호",
  telephone: "031-8068-6558",
  telephoneHref: "tel:+823180686558",
  email: "exven@exventure.co.kr",
  businessNumber: "464-81-03082",
  sourceLabel: "2026년 1월 회사소개서 기준",
} as const;

export const companyPrograms = [
  { step: "01", name: "기업 발굴", subtitle: "가능성의 발견", description: "자체 모집, 대학 경진대회와 협력 네트워크를 통해 창업기업을 발굴합니다.", items: ["창업기업 모집·발굴", "성장 단계와 지원 수요 파악"] },
  { step: "02", name: "Skill UP", subtitle: "창업의 기본기", description: "사업의 기초를 다지고, 비즈니스 모델과 검증할 가설을 구체화합니다.", items: ["IP·재무·마케팅·BM 교육", "사업타당성 가설·지표 설정"] },
  { step: "03", name: "Build UP", subtitle: "함께 만드는 역량", description: "맞춤형 팀빌딩과 실전 프로그램으로 아이디어를 실행할 역량을 기릅니다.", items: ["해커톤·메이커톤", "팀빌딩·컴퍼니빌더형 지원"] },
  { step: "04", name: "Make UP", subtitle: "제품과 사업의 구체화", description: "기술컨설팅과 MVP 제작 지원을 통해 제품을 구체화하고 IR을 준비합니다.", items: ["기술컨설팅·MVP 제작 지원", "IR 자료·발표 준비"] },
  { step: "05", name: "Show UP", subtitle: "시장에서의 검증", description: "시장 검증 결과를 바탕으로 비즈니스 모델을 다듬고 사업을 설명합니다.", items: ["시장 검증·BM 재정립", "데모데이·피칭"] },
  { step: "06", name: "해외 진출", subtitle: "더 넓은 시장으로", description: "목표 시장에 맞는 전략과 네트워크를 연결해 해외 진출을 준비합니다.", items: ["해외 진출 전략·박람회 지원", "바이어 상담·글로벌 네트워크 연결"] },
] as const;

export const companyHistory = [
  { date: "2025.12", title: "안성시 꿈마루 창업교육 및 컨설팅", organization: "경기도 안성시" },
  { date: "2025.11", title: "수원대학교 WoW! 창업축제·창업학 홍보데이", organization: "수원대학교" },
  { date: "2025.07", title: "수원대학교 WoW! 글로벌 프론티어", organization: "수원대학교 산학협력단" },
  { date: "2025.05", title: "시군청년혁신가 워크숍", organization: "전북창조경제혁신센터" },
  { date: "2024.07", title: "수원대학교 로컬콘텐츠 해커톤", organization: "수원대학교 산학협력단" },
  { date: "2024.02", title: "메이커스페이스 창업과정 마케팅 프로그램", organization: "중앙대학교 창업보육센터" },
  { date: "2023.11", title: "주식회사 엑스벤처 설립", organization: "" },
] as const;
