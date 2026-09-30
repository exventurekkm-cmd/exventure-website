export type PrivacyDetails = {
  version: string; controllerLegalName: string; privacyContactRole: string;
  processors: { name: string; purpose: string; dataItems: string; countries: string[]; retention: string }[];
  internationalTransfer: { status: "not_applicable" | "applicable"; approvedNotice: string };
};
const reviewedText = (value: unknown, max: number): value is string => typeof value === "string" && value.trim().length > 0 && value.length <= max && !/[\p{Cc}\p{Cf}]/u.test(value) && !/^(pending|tbd|todo|미정|확인.?필요|준비.?중)$/i.test(value.trim());
/** This validates completeness only. An accountable human must approve the provider/transfer review. */
export function readPrivacyDetails(raw: string | undefined, policyVersion: string, controller: string): PrivacyDetails | null {
  try {
    const value = JSON.parse(raw ?? "null") as PrivacyDetails | null;
    if (!value || typeof value !== "object" || value.version !== policyVersion || value.controllerLegalName !== controller || !reviewedText(value.controllerLegalName, 120) || !reviewedText(value.privacyContactRole, 120) || !Array.isArray(value.processors) || value.processors.length < 1 || value.processors.length > 20) return null;
    const processors: PrivacyDetails["processors"] = [];
    for (const processor of value.processors) {
      if (!processor || !reviewedText(processor.name, 120) || !reviewedText(processor.purpose, 500) || !reviewedText(processor.dataItems, 500) || !reviewedText(processor.retention, 500) || !Array.isArray(processor.countries) || processor.countries.length < 1 || processor.countries.length > 30 || !processor.countries.every(country => reviewedText(country, 100))) return null;
      processors.push({ name: processor.name, purpose: processor.purpose, dataItems: processor.dataItems, retention: processor.retention, countries: [...processor.countries] });
    }
    if (!["not_applicable", "applicable"].includes(value.internationalTransfer?.status) || !reviewedText(value.internationalTransfer?.approvedNotice, 5000)) return null;
    return { version: value.version, controllerLegalName: value.controllerLegalName, privacyContactRole: value.privacyContactRole, processors, internationalTransfer: { status: value.internationalTransfer.status, approvedNotice: value.internationalTransfer.approvedNotice } };
  } catch { return null; }
}
