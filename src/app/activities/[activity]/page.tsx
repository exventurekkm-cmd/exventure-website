import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { companyProfile, companyPrograms } from "@/lib/company-profile";
import { publicActivities } from "@/lib/public-activities";
import { activityListHref } from "@/lib/public-navigation";

export function generateStaticParams() { return publicActivities.map(item => ({ activity: item.slug })); }
function findActivity(slug: string) {
  const item = publicActivities.find(activity => activity.slug === slug);
  if (!item) notFound();
  return item;
}
export async function generateMetadata({ params }: { params: Promise<{ activity: string }> }): Promise<Metadata> {
  const item = findActivity((await params).activity);
  return { title: `${item.title} | 엑스벤처`, description: `${item.date} · ${item.title}. ${companyProfile.sourceLabel}에 수록된 주요 활동.` };
}
export default async function ActivityPage({ params }: { params: Promise<{ activity: string }> }) {
  const item = findActivity((await params).activity);
  const program = companyPrograms.find(program => program.step === item.programStep)!;
  const related = publicActivities.filter(activity => activity.slug !== item.slug);
  return <main id="main" tabIndex={-1} className="activity-detail frame-main">
    <nav className="frame-breadcrumb" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">›</span><a href={activityListHref(item.slug)}>주요 활동</a><span aria-hidden="true">›</span><span>활동 기록</span></nav>
    <header className="detail-heading"><p className="frame-kicker">{item.category}</p><h1>{item.title}</h1><p className="detail-date"><time dateTime={item.date.replace(".", "-")}>{item.date}</time><span>{item.organization}</span></p></header>
    <section className="detail-record" aria-labelledby="record-title"><h2 id="record-title">활동 기록</h2><dl><div><dt>프로그램</dt><dd>{item.title}</dd></div><div><dt>시기</dt><dd>{item.date}</dd></div><div><dt>기재 기관</dt><dd>{item.organization}</dd></div><div><dt>자료 기준</dt><dd>{companyProfile.sourceLabel} · 주요 이력</dd></div></dl></section>
    <section className="detail-program" aria-labelledby="more-programs"><p className="frame-kicker">EXVENTURE PROGRAM</p><h2 id="more-programs">지원 프로그램도 살펴보세요.</h2><div><span className="program-mark">{program.step}</span><div><h3>{program.name}</h3><p>{program.description}</p><a className="frame-link" href={`/business#program-${program.step}`}>프로그램 안내 <span aria-hidden="true">↗</span></a></div></div></section>
    <nav id="related-activities" className="detail-next" aria-label="다른 활동"><a className="frame-link" href={activityListHref(item.slug)}>활동 목록으로 <span aria-hidden="true">↗</span></a><div className="related-activities"><p>다른 활동</p>{related.map(activity => <a key={activity.slug} href={`/activities/${activity.slug}`}><strong>{activity.title}</strong><span aria-hidden="true">→</span></a>)}</div></nav>
  </main>;
}
