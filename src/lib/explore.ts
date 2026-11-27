import { companyPrograms } from "./company-profile";
import type { InquiryKind } from "./inquiries/contract";
import type { InquiryTopic } from "./public-tools";

export const fields = [
  { id: "education", label: "교육·팀빌딩" },
  { id: "product", label: "제품·시장 검증" },
  { id: "global", label: "해외 진출" },
] as const;
export type Program = typeof companyPrograms[number];
export const programHref = (p: Program) => "/business/" + p.slug;
export const inquiryHref = (id: string) => "/contact?interest=" + encodeURIComponent(id);

export type Interest = { id: string; label: string; kind: InquiryKind; topic: InquiryTopic; specific?: boolean };
const general: Interest[] = [
  { id: "general", label: "일반 문의", kind: "other", topic: "기타 문의" },
  { id: "business", label: "기업 진단·사업화 지원", kind: "business", topic: "사업화·컨설팅" },
  { id: "research", label: "시장검증·소비자 반응조사", kind: "research", topic: "시장 검증" },
  { id: "partners", label: "기관 협업", kind: "partnership", topic: "기관 협업" },
];
const categories: Record<Program["field"], Pick<Interest,"kind" | "topic">> = {
  education: { kind: "business", topic: "창업 교육" },
  product: { kind: "research", topic: "시장 검증" },
  global: { kind: "business", topic: "사업화·컨설팅" },
};
export const inquiryOptions = [
  { group: "", options: general },
  ...fields.map(field => {
    const offers = companyPrograms.filter(p => p.field === field.id);
    const options: Interest[] = offers.map(p => ({
      id: p.slug, label: p.label, specific: true,
      ...(p.slug === "make" ? { kind: "business" as const, topic: "사업화·컨설팅" as const } : categories[field.id]),
    }));
    if (offers.length > 1) options.unshift({
      id: "field-" + field.id, label: field.label + " 전반", specific: true, ...categories[field.id],
    });
    return { group: field.label, options };
  }),
];
const byId = new Map(inquiryOptions.flatMap(group => group.options.map(item => [item.id, item] as const)));
export function findInterest(id?: string | string[]) {
  return typeof id === "string" ? byId.get(id === "field-global" ? "global" : id) : undefined;
}
export function interestPrefix(choice?: Interest) {
  return choice?.specific ? "[" + choice.label + "]\n" : "";
}
