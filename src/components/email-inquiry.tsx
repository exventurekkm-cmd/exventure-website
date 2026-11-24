"use client";

import { useRef, useState, type FormEvent } from "react";
import { prepareInquiryEmail } from "@/lib/public-tools";
import { findInterest, interestPrefix } from "@/lib/explore";
import { InterestOptions } from "./interest-select";

export function EmailInquiry({ recipient, initialInterest }: { recipient: string; initialInterest?: string }) {
  const [interest, setInterest] = useState(initialInterest ?? "general");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState<ReturnType<typeof prepareInquiryEmail> | null>(null);
  const [status, setStatus] = useState("");
  const result = useRef<HTMLTextAreaElement>(null);
  const messageInput = useRef<HTMLTextAreaElement>(null);
  const choice = findInterest(interest);
  const prefix = interestPrefix(choice);
  const limit = 3000 - prefix.length;

  function clearDraft() { setDraft(null); setStatus(""); }
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!choice) return;
    if (message.trim().length < 10 || message.length > limit) {
      messageInput.current?.setCustomValidity("문의 내용을 10~" + limit.toLocaleString("ko-KR") + "자로 입력해주세요.");
      messageInput.current?.reportValidity();
      return;
    }
    setDraft(prepareInquiryEmail(choice.topic, title, prefix + message.trim(), recipient));
    setStatus("초안을 만들었습니다. 이메일 앱에서 내용을 확인한 뒤 보내주세요.");
    requestAnimationFrame(() => result.current?.focus());
  }
  async function copy() {
    if (!draft) return;
    try { await navigator.clipboard.writeText(draft.body); setStatus("문의 내용을 복사했습니다."); }
    catch { result.current?.focus(); result.current?.select(); setStatus("문의 내용을 선택했습니다. 복사해 이메일 본문에 붙여넣으세요."); }
  }
  return <>
    <h2>문의 내용 작성</h2><p className="form-hint">초안을 작성한 뒤 사용하시는 이메일 앱에서 보내주세요.</p>
    <form method="dialog" onSubmit={prepare}>
      <div className="field"><label htmlFor="email-topic">관심 분야</label><select id="email-topic" value={interest} onChange={e => {
        setInterest(e.target.value); messageInput.current?.setCustomValidity(""); clearDraft();
      }}><InterestOptions /></select></div>
      <div className="field"><label htmlFor="email-title">문의 제목</label><input id="email-title" required pattern=".*\S.*" maxLength={100}
        autoComplete="off" value={title} onChange={e => { setTitle(e.target.value); clearDraft(); }} /></div>
      <div className="field"><label htmlFor="email-message">문의 내용</label><textarea id="email-message" ref={messageInput} required minLength={10} maxLength={limit}
        rows={6} value={message} aria-describedby="email-help" onChange={e => { e.target.setCustomValidity(""); setMessage(e.target.value); clearDraft(); }} />
        <p id="email-help">10~{limit.toLocaleString("ko-KR")}자. 민감정보와 타인의 개인정보는 적지 마세요.</p></div>
      <button className="action" type="submit">문의 초안 만들기</button>
    </form>
    {draft && <div className="result"><label htmlFor="email-draft">문의 초안</label><textarea id="email-draft" ref={result} readOnly rows={7} value={draft.body} />
      <div className="result-actions"><button className="secondary" type="button" onClick={copy}>문의 내용 복사</button><a className="action" href={draft.href}>이메일 앱 열기</a></div>
      {!draft.includesBody && <p className="form-hint">내용이 길어 이메일 제목만 연결합니다. 초안을 복사해 이메일 본문에 붙여넣으세요.</p>}
    </div>}
    <p role="status" className="feedback">{status}</p>
    <noscript><p><a href={"mailto:" + recipient}>{recipient}로 이메일 보내기</a></p></noscript>
  </>;
}
