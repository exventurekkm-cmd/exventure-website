/** Local layout examples, not a claim about an executed event or a new product. */
export const programCompositionExample = [
  { title: "사전 준비", copy: "창업 단계와 목표를 파악하고 교육 주제를 정리합니다." },
  { title: "교육과 실습", copy: "비즈니스 모델, 팀빌딩, 시장 검증을 실습과 연결합니다." },
  { title: "피드백", copy: "멘토링을 통해 다음 실행 계획을 구체화합니다." },
] as const;
export const editorialPlanningPhoto = {
  src: "/review/editorial/planning-1500.webp", width: 1500, height: 1125,
  alt: "종이에 아이디어와 화면을 정리하는 참여자의 손",
  source: "https://unsplash.com/photos/wusOJ-2uY6w", author: "Amélie Mourichon",
} as const;

/** General business imagery; never paired with a named activity or its date. */
export const editorialPhotos = {
  education: { src: "/review/editorial/workshop-1500.webp", width: 1500, height: 1000, position: "50% 50%",
    alt: "창이 큰 공간에서 원형으로 앉아 의견을 나누는 사람들",
    source: "https://unsplash.com/photos/57oPg_ksI4k", author: "ASIA CULTURECENTER" },
  showcase: { src: "/review/samples/presentation-1400.webp", width: 1400, height: 933, position: "60% 55%",
    alt: "무대의 발표자를 바라보는 청중",
    source: "https://unsplash.com/photos/people-listening-to-a-person-in-a-stage-YrJ99TBRQvI", author: "Product School" },
  teamwork: { src: "/review/samples/teamwork-1400.webp", width: 1400, height: 933, position: "70% 50%",
    alt: "테이블에서 함께 자료를 검토하는 사람들",
    source: "https://unsplash.com/photos/two-women-sitting-at-a-table-with-a-laptop-mlwrIzr7yNs", author: "Creatopy" },
} as const;
export type EditorialPhoto = (typeof editorialPhotos)[keyof typeof editorialPhotos];
