import type { Metadata } from "next";
import { companyProfile } from "@/lib/company-profile";
import { publicActivities } from "@/lib/public-activities";
import { activityRowId } from "@/lib/public-navigation";

export const metadata: Metadata = { title: "주요 활동 | 엑스벤처", description: "엑스벤처의 창업 교육, 축제와 해커톤 활동 기록." };
export default function ActivitiesPage() {
  return <main id="main" tabIndex={-1} className="activity-index frame-main">
    <nav className="frame-breadcrumb" aria-label="현재 위치"><a href="/">홈</a><span aria-hidden="true">›</span><span>주요 활동</span></nav>
    <header className="activity-list-heading"><h1>주요 활동</h1><p>{companyProfile.sourceLabel}에 수록된 활동 기록입니다.</p></header>
    <ol id="activity-list" className="activity-list">{publicActivities.map(activity => <li key={activity.slug} id={activityRowId(activity.slug)} tabIndex={-1}>
      <a className="activity-list-row" href={"/activities/"+activity.slug} aria-label={activity.title+" 상세 보기"}>
        <span className="activity-record-date" aria-hidden="true"><span>{activity.date.slice(0,4)}</span><strong>{activity.date.slice(5)}</strong></span>
        <div><p className="activity-category">{activity.category}</p><h2>{activity.title}</h2><p className="ed-meta"><time dateTime={activity.date.replace(".","-")}>{activity.date}</time><span>{activity.organization}</span></p><span className="activity-list-action">활동 기록 보기 <span aria-hidden="true">↗</span></span></div>
      </a>
    </li>)}</ol>
    <div className="activity-list-footer"><a className="ed-text-link" href="/about#company-history">회사 전체 이력 <span aria-hidden="true">↗</span></a><a className="ed-text-link" href="/business">지원 프로그램 <span aria-hidden="true">↗</span></a></div>
  </main>;
}
