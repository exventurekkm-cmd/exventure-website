import Link from "next/link";
import { companyProfile as company, companyPrograms } from "@/lib/company-profile";
import { fields, programHref } from "@/lib/explore";
import { programPhotos } from "@/lib/field-photos";
import { Breadcrumb, PageHeading } from "./explore-parts";
import { ExplorePhoto } from "./explore-photo";
import { RecordDirectory } from "./company-history-directory";

export function CompanyOverview() {
  return <main id="main" tabIndex={-1}>
    <header className="program-cover"><div className="wrap"><Breadcrumb label="회사 소개" />
      <div className="program-spread about-spread"><div className="program-lead"><h1>회사 소개</h1>
        <p className="about-statement">창업 교육과 컨설팅,<br />사업화와 시장 검증을 함께합니다.</p>
        <p className="intro">엑스벤처는 초기 창업기업에 필요한 교육·멘토링과 기업·기관의 창업지원 프로그램을 기획하고 운영합니다.</p>
      </div><figure className="program-media"><ExplorePhoto photo={programPhotos.planning} priority /></figure></div>
    </div></header>
    <section className="wrap detail-band"><h2>회사 정보</h2><dl className="facts">
      {[["법인명",company.name],["대표자",company.representative],["설립일",company.established],["사업자등록번호",company.businessNumber],["주소",company.address]].map(([k,v]) =>
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
    </dl></section>
    <section className="light-band" id="company-history"><div className="wrap detail-band history-block"><h2>연혁</h2><RecordDirectory history /></div></section>
  </main>;
}
export function BusinessPrograms() {
  return <main id="main" tabIndex={-1}><PageHeading title="사업 분야" intro="지원 내용과 운영 프로그램을 분야별로 살펴보세요." />
    <div className="wrap content-space side-layout"><nav className="side-nav" aria-label="사업 분야 목차">
      {fields.map(f => <a key={f.id} href={"#" + f.id}>{f.label}</a>)}
    </nav><div className="catalog">{fields.map(f =>
      <section key={f.id} className="catalog-group" aria-labelledby={f.id}><h2 id={f.id}>{f.label}</h2>
        {companyPrograms.filter(p => p.field === f.id).map(p => <article key={p.slug} id={"program-" + p.step} className="catalog-item">
          <Link href={programHref(p)}><div><h3>{p.label}</h3>{p.label !== p.name && <span className="code">{p.name}</span>}</div>
            <p>{p.description}</p><span className="row-action">지원 내용 보기</span></Link></article>)}
      </section>)}</div></div>
  </main>;
}
