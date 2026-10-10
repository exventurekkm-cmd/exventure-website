import { companyHistory } from "@/lib/company-profile";
/** Dates, titles and institutions are from the January 2026 brochure.
 * Business imagery is kept separately in editorial-content.ts. */
export const publicActivities = [
  { slug: "anseong-dreammaru", ...companyHistory[0], category: "창업 교육 · 컨설팅", programStep: "02" },
  { slug: "suwon-wow-festival", ...companyHistory[1], category: "창업 축제 · 홍보", programStep: "05" },
  { slug: "local-content-hackathon", ...companyHistory[4], category: "로컬 콘텐츠 · 해커톤", programStep: "03" },
] as const;
export type PublicActivity = typeof publicActivities[number];
