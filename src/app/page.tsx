import Link from "next/link";
import Image from "next/image";
import { EditorialImage } from "@/components/activity-image";
import { HomeMotion } from "@/components/home-motion";
import { ProgramDisclosure } from "@/components/program-disclosure";
import { companyPrograms } from "@/lib/company-profile";
import { editorialPhotos, editorialPlanningPhoto } from "@/lib/editorial-content";
export default function Home() {
  const featuredPrograms = [companyPrograms[1],companyPrograms[2],companyPrograms[4]];
  return <main id="main" tabIndex={-1} className="home-page editorial-home direction-a">
    <HomeMotion />
    <div className="page-heading"><h1>창업 교육과 컨설팅</h1><span>엑스벤처의 활동</span></div>
    <nav className="mobile-reading-nav" aria-label="활동과 프로그램 탐색"><Link href="/activities">주요 활동</Link><a href="#programs">지원 프로그램</a><Link href="/about#company-history">전체 이력</Link></nav>
    <section id="activities" aria-label="창업 교육과 컨설팅 소개">
      <figure><Link className="photo-window lead-photo" href="/business#program-02" aria-label="창업 교육·컨설팅 프로그램 살펴보기">
        <EditorialImage photo={editorialPhotos.education} priority /></Link></figure>
      <div className="lead-caption"><h2><Link href="/business#program-02">창업의 기본기를 다지고,<br />다음 실행을 준비합니다.</Link></h2>
        <Link className="ed-caption-link" href="/business#program-02">프로그램 보기</Link>
        <p className="ed-meta"><span>Skill UP</span><span>창업 교육·멘토링</span></p>
      </div>
    </section>
    <section id="field" className="ed-section" aria-labelledby="field-title">
      <div className="ed-section-heading"><h2 id="field-title">축제와 해커톤</h2><Link className="ed-text-link" href="/activities">활동 목록 </Link></div>
      <article data-reveal><figure><Link className="photo-window festival-photo" href="/business#program-05" aria-label="시장 검증·피칭 프로그램 살펴보기"><EditorialImage photo={editorialPhotos.showcase} /></Link></figure>
        <div className="festival-caption"><div><h3><Link href="/business#program-05">아이디어를 알리고,<br />시장의 반응을 확인합니다.</Link></h3>
          <p className="ed-meta"><span>Show UP</span><span>데모데이·피칭</span></p></div>
          <Link className="ed-caption-link" href="/business#program-05">프로그램 보기</Link>
        </div>
      </article>
      <article className="compact-activity" data-reveal><figure><Link className="photo-window" href="/business#program-03" aria-label="팀빌딩·해커톤 프로그램 살펴보기"><EditorialImage photo={editorialPhotos.teamwork} /></Link></figure>
        <div><h3><Link href="/business#program-03">함께 만들고,<br />실행할 역량을 기릅니다.</Link></h3>
          <p className="ed-meta"><span>Build UP</span><span>팀빌딩·해커톤</span></p>
          <Link className="ed-text-link" href="/business#program-03">프로그램 안내 </Link>
        </div>
      </article>
    </section>
    <section id="programs" className="ed-section" aria-labelledby="programs-title">
      <div className="ed-section-heading"><h2 id="programs-title">지원 프로그램</h2><Link className="ed-text-link" href="/business">사업 영역 </Link></div>
      <div className="support-spread" data-reveal><div><p className="support-intro">기업 발굴에서 제품의 구체화,<br />시장 검증과 해외 진출 준비까지.</p>
        <p className="example-label">성장 단계에 맞춘 지원</p><ol className="agenda">{featuredPrograms.map(program => <li key={program.step}><h3>{program.name}</h3><p>{program.description}</p></li>)}</ol>
      </div><figure className="support-figure"><div className="photo-window"><Image className="ed-photo" src={editorialPlanningPhoto.src} alt={editorialPlanningPhoto.alt} width={editorialPlanningPhoto.width} height={editorialPlanningPhoto.height} sizes="(max-width:960px) calc(100vw - 48px), 300px" /></div></figure></div>
      <ProgramDisclosure><summary>전체 지원 프로그램<span aria-hidden="true">+</span></summary>
        <ul className="program-link-list">{companyPrograms.map(program => <li key={program.step}><Link href={"/business#program-"+program.step}>{program.name}</Link></li>)}</ul>
      </ProgramDisclosure>
    </section>
    <section className="ed-contact" aria-label="문의 안내"><div><h2>문의 안내</h2><p>프로그램 관련 문의는 회사 연락처로 연결됩니다.</p></div>
      <Link className="contact-action" href="/contact">문의 안내 보기 </Link>
    </section>
  </main>;
}
