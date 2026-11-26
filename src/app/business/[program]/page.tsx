import { pageMetadata } from "@/lib/share-metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { companyPrograms } from "@/lib/company-profile";
import { fields, inquiryHref } from "@/lib/explore";
import { publicActivities } from "@/lib/public-activities";
import { ActivityRows, Breadcrumb } from "@/components/explore-parts";
import { ExplorePhoto } from "@/components/explore-photo";

type Props = { params: Promise<{ program: string }> };
async function readProgram({ params }: Props) {
  const { program } = await params;
  return companyPrograms.find(p => p.slug === program) ?? notFound();
}
export const dynamicParams = false;
export function generateStaticParams() { return companyPrograms.map(p => ({program: p.slug})); }
export async function generateMetadata(props: Props) {
  const p = await readProgram(props);
  return pageMetadata(p.label, p.description, "/business/" + p.slug);
}
export default async function ProgramPage(props: Props) {
  const p = await readProgram(props);
  const field = fields.find(f => f.id === p.field)!;
  const related = publicActivities.filter(a => a.programStep === p.step);
  return <main id="main" tabIndex={-1}>
    <header className="program-cover"><div className="wrap">
      <Breadcrumb label="프로그램 안내" parent={{href:"/business",label:"사업 분야"}} />
      <div className="program-spread"><div className="program-lead">
        <p className="program-meta">{field.label}{p.label !== p.name && <span>{p.name}</span>}</p>
        <h1>{p.label}</h1><p className="intro">{p.description}</p>
        <Link className="action" href={inquiryHref(p.slug)}>이 프로그램 문의</Link>
      </div><figure className="program-media"><ExplorePhoto photo={p.photo} priority /></figure></div>
    </div></header>
    <section className="wrap detail-band"><h2>지원 내용</h2><ul className="support-list">{p.items.map(line => <li key={line}>{line}</li>)}</ul></section>
    {!!related.length && <section className="light-band"><div className="wrap detail-band"><h2>관련 활동</h2><ActivityRows records={related} /></div></section>}
    <div className="wrap back-line"><Link className="secondary" href={"/business#program-" + p.step}>프로그램 목록</Link></div>
  </main>;
}
