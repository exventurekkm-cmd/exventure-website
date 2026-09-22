import Link from "next/link";
import { accountUrl } from "@/lib/site";
export default function Home() {
  return <main id="main">
    <section className="home-hero">
      <div><p className="eyebrow">EXVENTURE · NEXT POSSIBILITIES</p><h1>다음 가능성을,<br /><span>함께 열어갑니다.</span></h1><p className="lead">엑스벤처의 사업과 소식을 만나고,<br />필요한 서비스로 연결되는 공간입니다.</p><Link className="button" href="/about">엑스벤처 알아보기 <span aria-hidden="true">↗</span></Link></div>
      <div className="hero-art" aria-hidden="true"><span className="orbit one" /><span className="orbit two" /><span className="orbit three" /><span className="art-word">NEXT<br />TOGETHER.</span><span className="art-dot" /></div>
    </section>
    <section className="home-paths" aria-label="주요 안내">
      <Link href="/business"><span className="eyebrow">01 / BUSINESS</span><h2>함께하는 사업</h2><p>엑스벤처의 사업 영역과 지원 프로그램을 살펴보세요.</p><span className="text-link">사업 안내 →</span></Link>
      <Link href="/tools"><span className="eyebrow">02 / TOOLS</span><h2>도구와 서비스</h2><p>새로운 도구를 만나고 나에게 필요한 서비스로 연결됩니다.</p><span className="text-link">도구 소개 →</span></Link>
      <Link href="/news"><span className="eyebrow">03 / STORIES</span><h2>엑스벤처의 소식</h2><p>함께 만들어가는 변화와 활동을 전합니다.</p><span className="text-link">소식 보기 →</span></Link>
    </section>
    <aside className="service-entry"><div><p className="eyebrow">YOUR SERVICES</p><h2>진행하던 업무를 이어가세요.</h2><p>회사 계정으로 로그인하면 사용할 수 있는 서비스를 확인할 수 있습니다.</p></div><a className="button secondary" href={accountUrl}>로그인 · 내 서비스 <span aria-hidden="true">↗</span></a></aside>
  </main>;
}
