import Link from "next/link";
import { companyPrograms } from "@/lib/company-profile";
import { fields, inquiryHref, programHref } from "@/lib/explore";
import { homePhotos } from "@/lib/field-photos";
import { publicActivities } from "@/lib/public-activities";
import { startupTools } from "@/lib/public-tools";
import { ActivityRows } from "@/components/explore-parts";
import { ExplorePhoto } from "@/components/explore-photo";
import { ExploreTabs } from "@/components/explore-tabs";

import { pageMetadata } from "@/lib/share-metadata";
export const metadata = {
  ...pageMetadata("창업·사업화 프로그램", "엑스벤처의 창업 교육과 팀빌딩, 제품·시장 검증, 해외 진출 프로그램을 살펴보세요.", "/", "home"),
  title: { absolute: "엑스벤처 | 창업·사업화 프로그램" },
};

export default function Home() {
  return <main id="main" tabIndex={-1}>
    <section className="explore-cover" id="programs"><div className="wrap">
      <div className="heading-line home-title"><h1>창업·사업화 프로그램</h1><p>기업·기관의 목표와 참여 대상에 맞춰 운영합니다.</p></div>
      <ExploreTabs label="지원 분야" dark panelClass="field-panel" tabs={fields.map((field, index) => ({
        id: "field-" + field.id, label: field.label, content: <>
          <div className="field-offers">{companyPrograms.filter(p => p.field === field.id).map(p =>
            <article key={p.slug}><h2><Link className="title-link" href={programHref(p)}>{p.label}{p.name !== p.label && <span className="code">{p.name}</span>}</Link></h2>
              <ul>{p.items.map(item => <li key={item}>{item}</li>)}</ul></article>
          )}<Link className="action" href={inquiryHref("field-" + field.id)}>이 분야 문의</Link></div>
          <div className="field-media">
            {/* A 16:9 photo covers at least 462px of panel height on desktop. */}
            <ExplorePhoto photo={homePhotos[field.id]} priority={index === 0} sizes="(max-width: 760px) 92vw, 840px" />
          </div>
        </>,
      }))} />
      <noscript><p><Link className="button-light" href="/business">전체 프로그램 안내</Link></p></noscript>
    </div></section>
    <section id="activities" className="wrap home-band"><div className="side-caption"><h2>주요 활동</h2><Link className="quiet-link" href="/activities">활동 전체 보기</Link></div>
      <ActivityRows records={publicActivities.slice(0, 3)} /></section>
    <section className="light-band"><div className="wrap home-band"><h2>창업지원 도구</h2><div className="tool-links">
      {Object.entries(startupTools).map(([id, tool]) => <Link key={id} href={"/tools#" + id}><h3>{tool.title}</h3><p>{tool.description}</p></Link>)}
    </div></div></section>
  </main>;
}
