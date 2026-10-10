import Image from "next/image";
import { ReadingNav } from "@/components/reading-nav";
import { companyHistory, companyProfile } from "@/lib/company-profile";
import { publicActivities } from "@/lib/public-activities";
import { historyRecordHref } from "@/lib/public-navigation";
export function ContentDirectory() {
  return <aside className="content-directory" aria-label="활동과 지원">
    <div className="directory-inner"><p className="directory-label">본문 목차</p><ReadingNav />
      <p className="directory-note">활동명·기관·날짜는<br />회사소개서에 따른 기록입니다.</p>
    </div>
  </aside>;
}
export function CompanyContext() {
  return <aside className="company-context" aria-label="최근 기록과 회사 연락처">
    <div className="context-industrial"><Image src="/brand/exventure-industrial-v1.png" alt="" fill sizes="325px" /><i aria-hidden="true" /></div>
    <div className="context-inner">
      <section className="context-updates"><h2>최근 기록</h2>
        <ol className="context-records">{companyHistory.slice(0,3).map(record => {
          const activity = publicActivities.find(item => item.date === record.date && item.title === record.title);
          return <li key={record.date}><a href={activity ? "/activities/"+activity.slug : historyRecordHref(record.date)}>
            <time dateTime={record.date.replace(".","-")}>{record.date}</time><p>{record.title}</p>
          </a>
        </li>;})}</ol>
        <a className="ed-text-link" href="/about#company-history">전체 이력 <span aria-hidden="true">↗</span></a>
      </section>
      <section className="context-company"><h2>{companyProfile.name}</h2>
        <p>창업 교육과 컨설팅,<br />사업화·시장 검증·해외 진출 준비를 함께합니다.</p>
        <div className="context-contact"><address><a href={"mailto:"+companyProfile.email}>{companyProfile.email}</a><a href={companyProfile.telephoneHref}>{companyProfile.telephone}</a></address></div>
      </section>
      <p className="context-source">{companyProfile.sourceLabel}</p>
    </div>
  </aside>;
}
