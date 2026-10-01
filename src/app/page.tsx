import Link from "next/link";
import { accountUrl } from "@/lib/site";

const services = [
  { number: "01", title: "기업 진단", question: "지금, 무엇부터 풀어야 할까요?", output: "현재 상황과 핵심 과제의 정리", href: "/business", link: "사업 영역" },
  { number: "02", title: "소비자 반응조사", question: "우리의 가정은 고객에게도 맞을까요?", output: "소비자 반응과 판단의 근거", href: "/tools", link: "업무 도구" },
  { number: "03", title: "분기 로드맵", question: "다음 분기에는 무엇에 집중할까요?", output: "우선순위와 분기별 실행 계획", href: "/tools", link: "업무 도구" },
];

const process = [
  { title: "질문 설정", description: "해결하려는 문제와 판단의 기준을 정합니다." },
  { title: "근거 수집", description: "기업의 현황과 소비자의 반응을 살펴봅니다." },
  { title: "우선순위", description: "모인 근거를 바탕으로 집중할 과제를 고릅니다." },
  { title: "실행 로드맵", description: "선택한 과제를 분기별 실행 계획으로 연결합니다." },
];

export default function Home() {
  return (
    <main id="main" tabIndex={-1} className="home-page">
      <section className="home-opening" aria-labelledby="opening-title">
        <div className="opening-copy">
          <p className="editorial-label">EXVENTURE · RESEARCH &amp; STRATEGY</p>
          <h1 id="opening-title">기업의 질문을,<br />실행의 순서로.</h1>
          <p className="opening-lead">기업의 현재를 진단하고, 소비자의 반응으로 가정을 검증합니다. 그 근거를 다음 분기의 우선순위와 실행 계획으로 이어갑니다.</p>
          <Link className="editorial-link" href="#services">우리가 하는 일 <span aria-hidden="true">↓</span></Link>
          <p className="opening-index"><span>기업 진단</span><span aria-hidden="true">→</span><span>반응 검증</span><span aria-hidden="true">→</span><span>분기 로드맵</span></p>
        </div>
        <aside className="roadmap-specimen" aria-label="분기 로드맵의 구성 예시">
          <div className="specimen-top"><span>WORKING DOCUMENT</span><span className="specimen-example">구성 예시</span></div>
          <p className="specimen-caption">질문에서 계획까지</p>
          <h2>다음 분기의<br />판단을 위한 노트.</h2>
          <dl className="specimen-lines">
            <div><dt><span>01</span> 질문</dt><dd>무엇을 먼저 확인할 것인가</dd></div>
            <div><dt><span>02</span> 근거</dt><dd>현황과 소비자 반응을 함께 보기</dd></div>
            <div><dt><span>03</span> 선택</dt><dd>집중할 과제와 그 이유 정리하기</dd></div>
            <div><dt><span>04</span> 실행</dt><dd>분기별 계획으로 옮기기</dd></div>
          </dl>
          <p className="specimen-note">산출물의 구성을 설명하는 예시입니다.<br />실제 고객 자료나 성과를 나타내지 않습니다.</p>
        </aside>
      </section>

      <section id="services" className="home-services" aria-labelledby="services-title">
        <div className="section-heading"><p className="editorial-label">01 / WHAT WE DO</p><h2 id="services-title">질문에 맞는 접근,<br className="mobile-break" /> 결정에 필요한 결과물.</h2></div>
        <div className="service-index">
          {services.map(service => <div className="service-row" key={service.number}>
            <span className="service-number">{service.number}</span>
            <h3>{service.title}</h3>
            <div className="service-question"><span className="row-label">질문</span><p>{service.question}</p></div>
            <div className="service-output"><span className="row-label">결과물</span><p>{service.output}</p></div>
            <Link className="service-link" href={service.href}>{service.link}<span aria-hidden="true">↗</span><span className="sr-only"> · {service.title}</span></Link>
          </div>)}
        </div>
      </section>

      <section className="home-method" aria-labelledby="method-title">
        <div className="section-heading"><p className="editorial-label">02 / HOW WE WORK</p><h2 id="method-title">하나의 질문이<br />실행 계획이 되기까지.</h2></div>
        <ol className="method-sequence">
          {process.map((step, index) => <li key={step.title}><span className="method-number">0{index + 1}</span><h3>{step.title}</h3><p>{step.description}</p></li>)}
        </ol>
      </section>

      <section className="home-connect" aria-labelledby="connect-title">
        <div><p className="editorial-label">03 / CONNECT</p><h2 id="connect-title">다음 질문을<br />함께 정리합니다.</h2><Link className="editorial-link" href="/contact">문의 안내 <span aria-hidden="true">↗</span></Link></div>
        <div className="work-entry"><p className="row-label">EXVENTURE WORKSPACE</p><h3>진행 중인 업무가 있나요?</h3><p>회사 계정으로 로그인하고<br />워크스페이스에서 업무를 이어가세요.</p><a className="editorial-link" href={accountUrl}>로그인 <span aria-hidden="true">↗</span></a></div>
      </section>
    </main>
  );
}
