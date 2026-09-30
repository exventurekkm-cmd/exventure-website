import Link from "next/link";
import { BrandSymbol } from "@/components/brand";
import { accountUrl } from "@/lib/site";
const paths = [
  { href: "/business", number: "01", category: "BUSINESS", title: "함께하는 사업", description: "엑스벤처의 사업 영역과 지원 프로그램을 살펴보세요.", action: "사업 안내" },
  { href: "/tools", number: "02", category: "TOOLS", title: "도구와 서비스", description: "새로운 도구를 만나고 나에게 필요한 서비스로 연결됩니다.", action: "도구 소개" },
  { href: "/news", number: "03", category: "STORIES", title: "엑스벤처의 소식", description: "함께 만들어가는 변화와 활동을 전합니다.", action: "소식 보기" },
];
export default function Home() {
  return <main id="main" tabIndex={-1}>
    <section className="home-hero" aria-labelledby="home-title">
      <div className="hero-copy">
        <p className="eyebrow">NEXT POSSIBILITIES, TOGETHER</p>
        <h1 id="home-title">다음 가능성을,<br /><span>함께 열어갑니다.</span></h1>
        <p className="lead">엑스벤처의 사업과 소식을 만나고,<br />필요한 서비스로 연결되는 공간입니다.</p>
        <Link className="button hero-cta" href="/about">엑스벤처 알아보기 <span aria-hidden="true">↗</span></Link>
        <p className="hero-footnote">EXVENTURE <span>기업의 다음 단계를 함께.</span></p>
      </div>
      <div className="hero-art" aria-hidden="true"><span className="art-caption">EXPAND THE POSSIBILITIES</span><BrandSymbol /><span className="art-bottom">NEXT<br />TOGETHER.</span></div>
    </section>
    <section className="home-paths-section" aria-labelledby="explore-title">
      <div className="section-heading"><p className="eyebrow">EXPLORE EXVENTURE</p><h2 id="explore-title">더 넓은 가능성으로 연결합니다.</h2></div>
      <div className="home-paths">{paths.map(path => <Link key={path.href} href={path.href}>
        <span className="path-meta"><span>{path.number}</span>{path.category}</span>
        <h3>{path.title}</h3><p>{path.description}</p><span className="path-action">{path.action}<span aria-hidden="true">↗</span></span>
      </Link>)}</div>
    </section>
    <aside className="service-entry"><div><p className="eyebrow">YOUR WORKSPACE</p><h2>진행하던 업무를 이어가세요.</h2><p>회사 계정으로 로그인하면 사용할 수 있는 서비스를 확인할 수 있습니다.</p></div><a className="button primary" href={accountUrl}>로그인 · 내 서비스 <span aria-hidden="true">↗</span></a></aside>
  </main>;
}
