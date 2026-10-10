import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { accountUrl, sections } from "@/lib/site";
import { BusinessPrograms, CompanyOverview } from "@/components/company-profile";
import "@/styles/company.css";
function readSection(value: string) {
  if (!Object.hasOwn(sections, value)) notFound();
  return sections[value as keyof typeof sections];
}
export function generateStaticParams() { return Object.keys(sections).map(section => ({ section })); }
export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const section = readSection((await params).section);
  return { title: `${section.title} | 엑스벤처`, description: section.description };
}
export default async function SectionPage({ params }: { params: Promise<{ section: string }> }) {
  const key = (await params).section, section = readSection(key);
  return <main id="main" tabIndex={-1} className="section-page"><p className="eyebrow">{section.eyebrow}</p><h1>{section.title}</h1><p className="lead">{section.description}</p>{key === "about" && <CompanyOverview />}{key === "business" && <BusinessPrograms />}<div className="section-actions"><a href="/" className="text-link">← 홈으로</a>{key === "tools" && <a className="button primary" href={accountUrl}>직원 로그인 <span aria-hidden="true">↗</span></a>}</div></main>;
}
