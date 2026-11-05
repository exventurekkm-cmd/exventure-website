"use client";

import { useRef, useState, type FormEvent } from "react";
import { inquiryTopics, prepareInquiryEmail, type InquiryTopic } from "@/lib/public-tools";

export function EmailInquiry({ recipient }: { recipient: string }) {
  const [topic, setTopic] = useState<InquiryTopic>(inquiryTopics[0]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<ReturnType<typeof prepareInquiryEmail> | null>(null);
  const [status, setStatus] = useState("");
  const result = useRef<HTMLTextAreaElement>(null);
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraft(prepareInquiryEmail(topic, title, message, recipient));
    setStatus("이메일 초안을 정리했습니다. 내용을 확인한 뒤 이메일 앱에서 보내주세요.");
    requestAnimationFrame(() => result.current?.focus());
  }
  async function copy() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.body);
      setStatus("문의 내용을 복사했습니다. 이메일 본문에 붙여넣어 주세요.");
    } catch {
      result.current?.focus(); result.current?.select();
      setStatus("아래 내용을 선택했습니다. 복사하여 이메일 본문에 붙여넣어 주세요.");
    }
  }
  return <section className="email-inquiry" aria-labelledby="email-inquiry-title">
    <p className="editorial-label">EMAIL INQUIRY</p>
    <h2 id="email-inquiry-title">이메일로 문의하기</h2>
    <p className="contact-hint">문의 내용을 정리한 뒤 사용하시는 이메일 앱에서 보내주세요.</p>
    <form onSubmit={prepare}>
      <div className="contact-field"><label htmlFor="email-topic">문의 종류</label><select id="email-topic" value={topic} onChange={event => { setTopic(event.target.value as InquiryTopic); setDraft(null); setStatus(""); }}>{inquiryTopics.map(item => <option key={item}>{item}</option>)}</select></div>
      <div className="contact-field"><label htmlFor="email-title">제목</label><input id="email-title" value={title} required maxLength={100} onChange={event => { setTitle(event.target.value); setDraft(null); setStatus(""); }} autoComplete="off" /></div>
      <div className="contact-field"><label htmlFor="email-message">문의 내용</label><textarea id="email-message" value={message} required minLength={10} maxLength={3000} rows={7} aria-describedby="email-message-help" onChange={event => { setMessage(event.target.value); setDraft(null); setStatus(""); }} /><p id="email-message-help" className="contact-hint">필요한 지원, 희망 일정, 함께 검토할 내용을 적어주세요. 10~3,000자.</p></div>
      <button className="button primary" type="submit">이메일 초안 만들기 <span aria-hidden="true">↗</span></button>
    </form>
    <p className="contact-hint" role="status">{status}</p>
    {draft && <div className="email-draft">
      <label htmlFor="email-draft">보낼 내용</label><textarea ref={result} id="email-draft" readOnly value={draft.body} rows={9} />
      <div className="draft-actions"><button type="button" className="button secondary" onClick={copy}>문의 내용 복사</button><a className="button primary" href={draft.href}>이메일 앱 열기 <span aria-hidden="true">↗</span></a></div>
      <p className="contact-hint">{draft.includesBody ? "이메일 앱에서 내용과 받는 주소를 확인한 뒤 전송해주세요." : "내용이 길어 이메일 제목만 연결합니다. 위 초안을 복사해 이메일 본문에 붙여넣어 주세요."} 이메일 앱이 없으면 {recipient}로 직접 보내실 수 있습니다.</p>
    </div>}
  </section>;
}
