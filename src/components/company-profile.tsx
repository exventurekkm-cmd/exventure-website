import Link from "next/link";
import { companyHistory, companyProfile, companyPrograms } from "@/lib/company-profile";

export function CompanyOverview() {
  return <div className="company-content">
    <section className="company-section" aria-labelledby="company-purpose">
      <div><p className="editorial-label">01 / OUR PURPOSE</p><h2 id="company-purpose">아이디어가 사업이 되고,<br />성장이 이어지도록.</h2></div>
      <div className="company-prose"><p>엑스벤처는 초기 창업기업의 사업 역량 강화와 지속 가능한 성장을 돕습니다. 창업 교육, 컨설팅과 멘토링을 통해 실현 가능한 계획을 함께 세웁니다.</p><p>비즈니스 모델과 시장을 검토하고, 제품 구체화와 IR 준비를 연결합니다. 나아가 글로벌 시장 진출의 기반을 마련하며 창업 생태계의 성장에 기여하고자 합니다.</p><Link className="editorial-link" href="/business">지원 프로그램 살펴보기 <span aria-hidden="true">↗</span></Link></div>
    </section>
    <section className="company-section" aria-labelledby="company-facts">
      <div><p className="editorial-label">02 / COMPANY FACTS</p><h2 id="company-facts">주식회사 엑스벤처</h2><p className="company-source">{companyProfile.sourceLabel}</p></div>
      <dl className="company-facts">
        <div><dt>회사명</dt><dd>{companyProfile.name}<br /><span lang="en">{companyProfile.englishName}</span></dd></div>
        <div><dt>대표자</dt><dd>{companyProfile.representative}</dd></div>
        <div><dt>설립일</dt><dd><time dateTime="2023-11-03">{companyProfile.established}</time></dd></div>
        <div><dt>사업 분야</dt><dd>경영컨설팅 · 창업 교육 · 사업화 지원</dd></div>
        <div><dt>사업자등록번호</dt><dd>{companyProfile.businessNumber}</dd></div>
        <div><dt>소재지</dt><dd>{companyProfile.address}</dd></div>
      </dl>
    </section>
    <section className="company-section" aria-labelledby="company-history">
      <div><p className="editorial-label">03 / SELECTED HISTORY</p><h2 id="company-history">함께해 온 과정</h2><p className="company-source">회사소개서에 수록된 주요 이력입니다.</p></div>
      <ol className="company-history">{companyHistory.map(item => <li key={item.date + item.title}><time dateTime={item.date.replace(".", "-")}>{item.date}</time><div><h3>{item.title}</h3>{item.organization && <p>{item.organization}</p>}</div></li>)}</ol>
    </section>
    <div className="company-next"><p>기업의 현재와 다음 단계를 함께 이야기합니다.</p><Link className="editorial-link" href="/contact">협업 문의 <span aria-hidden="true">↗</span></Link></div>
  </div>;
}

export function BusinessPrograms() {
  return <div className="company-content">
    <section className="program-section" aria-labelledby="program-title"><div className="section-heading"><p className="editorial-label">01 / GROWTH PROGRAM</p><div><h2 id="program-title">기업의 단계에 맞춘<br />성장 지원 프로그램.</h2><p className="company-source">{companyProfile.sourceLabel}</p></div></div>
      <ol className="company-programs">{companyPrograms.map(program => <li key={program.step}><span className="program-step">{program.step}</span><div><p className="program-subtitle">{program.subtitle}</p><h3>{program.name}</h3></div><p className="program-description">{program.description}</p><ul>{program.items.map(item => <li key={item}>{item}</li>)}</ul></li>)}</ol>
    </section>
    <section className="company-section" aria-labelledby="program-method"><div><p className="editorial-label">02 / FROM PLAN TO ACTION</p><h2 id="program-method">교육에서 실행까지,<br />근거를 쌓는 과정.</h2></div><div className="company-prose"><p>창업 아카데미와 맞춤형 멘토링으로 역량을 강화하고, 시장 반응을 확인하며 IR 피칭과 후속 판로 개척을 준비합니다.</p><p>진행 중인 기업 진단·로드맵과 소비자 반응조사 업무는 직원 로그인 후 허용된 업무 공간에서 이어갈 수 있습니다.</p><Link className="editorial-link" href="/tools">업무 도구 안내 <span aria-hidden="true">↗</span></Link></div></section>
    <div className="company-next"><p>기업·기관의 목표와 필요한 지원을 알려주세요.</p><Link className="editorial-link" href="/contact">프로그램 문의 <span aria-hidden="true">↗</span></Link></div>
  </div>;
}
