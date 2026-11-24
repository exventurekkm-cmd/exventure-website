import { companyHistory } from "@/lib/company-profile";

// Dates, institutions and titles are the published brochure records. Only the
// three previously documented program associations are shown as related.
const directory = [
  { date: "2025.12", slug: "anseong-dreammaru", programStep: "02" },
  { date: "2025.11", slug: "suwon-wow-festival", programStep: "05" },
  { date: "2025.07", slug: "suwon-global-frontier", programStep: null },
  { date: "2025.05", slug: "youth-innovators-workshop", programStep: null },
  { date: "2024.07", slug: "local-content-hackathon", programStep: "03" },
  { date: "2024.02", slug: "makerspace-marketing", programStep: null },
] as const;

export const publicActivities = directory.map(item => {
  const record = companyHistory.find(row => row.date === item.date);
  if (!record) throw new Error("Missing company history record: " + item.date);
  return { ...record, ...item };
});
export type PublicActivity = typeof publicActivities[number];
