import Link from "next/link";
import { accountUrl } from "@/lib/site";

const services = [
  { number: "01", title: "창업 교육·멘토링", question: "사업의 시작에 무엇이 필요할까요?", output: "창업 역량과 비즈니스 모델의 구체화", href: "/business", link: "사업 영역" },
  { number: "02", title: "사업화·시장 검증", question: "아이디어가 시장에서도 통할까요?", output: "MVP 제작 지원과 시장 반응의 확인", href: "/business", link: "사업 영역" },
  { number: "03", title: "IR·성장 지원", question: "기업의 가능성을 어떻게 설명할까요?", output: "IR 준비와 데모데이·피칭", href: "/business", link: "사업 영역" },
  { number: "04", title: "글로벌 진출", question: "다음 시장에는 어떻게 다가갈까요?", output: "해외 진출 전략과 네트워크 연결", href: "/business", link: "사업 영역" },
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
          <p className="editorial-label">EXVENTURE · INVESTMENT &amp; CONSULTING</p>
          <h1 id="opening-title">창업의 가능성을,<br />다음 성장으로.</h1>
          <p className="opening-lead">창업 교육과 맞춤형 컨설팅, 시장 검증과 IR 준비를 연결합니다. 초기 기업의 실행 계획을 함께 세우고, 글로벌 시장으로 나아갈 기반을 만듭니다.</p>
          <Link className="editorial-link" href="#services">우리가 하는 일 <span aria-hidden="true">↓</span></Link>
          <p className="opening-index"><span>역량 강화</span><span aria-hidden="true">→</span><span>사업화·검증</span><span aria-hidden="true">→</span><span>시장 확장</span></p>
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
