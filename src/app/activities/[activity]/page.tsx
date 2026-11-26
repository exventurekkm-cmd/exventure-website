import { pageMetadata } from "@/lib/share-metadata";
import Link from "next/link";
import { notFound } from "next/navigation";
import { companyPrograms } from "@/lib/company-profile";
import { publicActivities } from "@/lib/public-activities";
import { activityListHref, historyRecordHref } from "@/lib/public-navigation";
import { programHref } from "@/lib/explore";
import { Breadcrumb } from "@/components/explore-parts";

type Props = { params: Promise<{activity: string}> };
async function readActivity({params}: Props) {
  const {activity} = await params;
  return publicActivities.find(a => a.slug === activity) ?? notFound();
}
export const dynamicParams = false;
export function generateStaticParams() { return publicActivities.map(a => ({activity:a.slug})); }
export async function generateMetadata(props: Props) {
  const a = await readActivity(props);
  return pageMetadata(a.title, a.date + " · " + a.organization, "/activities/" + a.slug);
}
export default async function ActivityPage(props: Props) {
  const a = await readActivity(props);
  const [year, month] = a.date.split(".");
  const program = companyPrograms.find(p => p.step === a.programStep);
  const others = publicActivities.filter(other => other.slug !== a.slug && other.date.startsWith(year));
  return <main id="main" tabIndex={-1}>
    <header className="record-head"><div className="wrap"><Breadcrumb label="활동 기록" parent={{href:activityListHref(a.slug),label:"주요 활동"}} />
      <div className="record-spread"><div className="calendar" aria-label="활동 시기"><span>{year}년</span><strong>{month}<small>월</small></strong></div>
        <div className="record-heading"><h1>{a.title}</h1><p>{a.organization}</p></div></div>
    </div></header>
    <div className="wrap record-body">{program ? <section className="detail-band"><h2>관련 프로그램</h2>
      <div className="related-offer"><h3><Link href={programHref(program)}>{program.label}</Link></h3><p>{program.description}</p><Link className="secondary" href={programHref(program)}>프로그램 안내</Link></div></section>
    : <section className="detail-band"><h2>함께 볼 기록</h2><div className="reading-list">
      {others.map(r => <Link href={"/activities/"+r.slug} key={r.slug}><strong>{r.title}</strong><time dateTime={r.date.replace(".","-")}>{r.date}</time></Link>)}
    </div></section>}
    <div className="back-line"><Link className="secondary" href={activityListHref(a.slug)}>활동 목록</Link><Link className="quiet-link" href={historyRecordHref(a.date)}>연혁에서 보기</Link></div></div>
  </main>;
}
