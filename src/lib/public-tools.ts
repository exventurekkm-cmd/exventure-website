export const inquiryTopics = ["창업 교육", "사업화·컨설팅", "시장 검증", "기관 협업", "기타 문의"] as const;
export type InquiryTopic = (typeof inquiryTopics)[number];

const singleLine = (value: string) => value.replace(/[\r\n\u0000-\u001f\u007f]/g, " ").trim();

export function prepareInquiryEmail(topic: InquiryTopic, title: string, message: string, recipient: string) {
  if (!inquiryTopics.includes(topic) || !/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(recipient)) throw new Error("Invalid inquiry destination");
  const subject = `[엑스벤처 · ${topic}] ${singleLine(title).slice(0, 100)}`;
  const body = `문의 종류: ${topic}\n제목: ${singleLine(title).slice(0, 100)}\n\n${message.replace(/\r\n?/g, "\n").trim().slice(0, 3000)}`;
  const base = `mailto:${recipient}?subject=${encodeURIComponent(subject)}`;
  const full = `${base}&body=${encodeURIComponent(body)}`;
  // Long Korean text can exceed mail clients' URI limit; keep the complete copyable draft.
  const includesBody = full.length <= 1800;
  return { subject, body, href: includesBody ? full : base, includesBody };
}

export const startupTools = {
  plan: {
    title: "사업계획 정리", label: "01 / BUSINESS PLAN", filename: "사업계획_정리.txt",
    description: "누구의 어떤 문제를 해결할지 정리하고, 다음 실행으로 연결하세요.",
    fields: [
      { key: "customer", label: "핵심 고객", hint: "도움이 필요한 고객과 고객이 처한 상황" },
      { key: "problem", label: "해결할 문제", hint: "고객이 겪는 불편과 현재 사용하는 대안" },
      { key: "solution", label: "제안하는 해결 방법", hint: "제품·서비스의 핵심 기능과 고객에게 주는 변화" },
      { key: "next", label: "다음 실행", hint: "가장 먼저 확인할 가설, 실행 방법과 확인 기준" },
    ],
  },
  research: {
    title: "시장조사 설계", label: "02 / MARKET RESEARCH", filename: "시장조사_설계.txt",
    description: "조사할 질문, 만날 대상, 확인할 자료를 한 장에 모아보세요.",
    fields: [
      { key: "question", label: "확인할 질문", hint: "고객의 필요, 구매 상황 등 조사로 확인하고 싶은 질문" },
      { key: "audience", label: "조사 대상", hint: "인터뷰·설문에 참여할 고객의 특징과 모집 방법" },
      { key: "sources", label: "자료와 조사 방법", hint: "확인할 자료의 출처, 비교 대상, 인터뷰·설문 방법" },
      { key: "decision", label: "결과 활용", hint: "어떤 결과를 기준으로 무엇을 결정할지" },
    ],
  },
} as const;
export type StartupTool = keyof typeof startupTools;
export function createStartupNote(tool: StartupTool, answers: Record<string, string>): string {
  const definition = startupTools[tool];
  return [definition.title, "", ...definition.fields.flatMap((field, index) => [
    `${index + 1}. ${field.label}`, (answers[field.key] ?? "").trim().slice(0, 1500), "",
  ])].join("\n").trimEnd();
}
