"use client";

import { useRef, useState, type FormEvent } from "react";
import { createStartupNote, startupTools, type StartupTool } from "@/lib/public-tools";

export function StartupTools() {
  const [selected, setSelected] = useState<StartupTool>("plan");
  const [answers, setAnswers] = useState<Record<StartupTool, Record<string, string>>>({ plan: {}, research: {} });
  const [notes, setNotes] = useState<Partial<Record<StartupTool, string>>>({});
  const [status, setStatus] = useState("");
  const output = useRef<HTMLTextAreaElement>(null);
  const current = startupTools[selected], note = notes[selected];
  function build(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotes(previous => ({ ...previous, [selected]: createStartupNote(selected, answers[selected]) }));
    setStatus("정리 문서가 만들어졌습니다. 내용을 확인하고 복사하거나 내려받으세요.");
    requestAnimationFrame(() => output.current?.focus());
  }
  async function copy() {
    if (!note) return;
    try { await navigator.clipboard.writeText(note); setStatus("정리 문서를 복사했습니다."); }
    catch { output.current?.focus(); output.current?.select(); setStatus("정리 문서를 선택했습니다. 복사하여 사용해주세요."); }
  }
  function download() {
    if (!note) return;
    const url = URL.createObjectURL(new Blob(["\uFEFF", note], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = current.filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("정리 문서를 텍스트 파일로 내려받았습니다.");
  }
  return <div className="startup-tools">
    <section aria-labelledby="tool-directory"><p className="editorial-label">START WITH A QUESTION</p><h2 id="tool-directory">지금 필요한 작업을 선택하세요.</h2>
      <div className="tool-options">{(Object.keys(startupTools) as StartupTool[]).map(key => <button type="button" key={key} aria-pressed={key === selected} onClick={() => { setSelected(key); setStatus(""); }}><span>{startupTools[key].label}</span><strong>{startupTools[key].title}</strong><span>{startupTools[key].description}</span><span className="tool-option-action">{key === selected ? "선택한 도구" : "도구 열기"} <span aria-hidden="true">↗</span></span></button>)}</div>
    </section>
    <section className="tool-workarea" aria-labelledby="tool-workarea-title">
      <div className="tool-heading"><p className="editorial-label">WORKSHEET</p><h2 id="tool-workarea-title">{current.title}</h2><p>{current.description}</p></div>
      <form onSubmit={build}>
        {current.fields.map((field, index) => <div className="tool-field" key={field.key}><label htmlFor={`tool-${field.key}`}><span aria-hidden="true">0{index + 1}</span>{field.label}</label><p id={`tool-${field.key}-hint`}>{field.hint}</p><textarea id={`tool-${field.key}`} rows={3} required minLength={2} maxLength={1500} aria-describedby={`tool-${field.key}-hint`} value={answers[selected][field.key] ?? ""} onChange={event => { setAnswers(previous => ({ ...previous, [selected]: { ...previous[selected], [field.key]: event.target.value } })); setNotes(previous => ({ ...previous, [selected]: undefined })); setStatus(""); }} /></div>)}
        <div className="tool-submit"><button className="button primary" type="submit">정리 문서 만들기 <span aria-hidden="true">↗</span></button><p>작성한 내용을 항목별로 모아 문서로 정리합니다.</p></div>
      </form>
      <p className="tool-status" role="status">{status}</p>
      {note && <div className="tool-result"><label htmlFor="tool-result">정리 문서</label><textarea ref={output} id="tool-result" rows={14} readOnly value={note} /><div className="tool-result-actions"><button className="button secondary" type="button" onClick={copy}>내용 복사</button><button className="button primary" type="button" onClick={download}>텍스트 파일 내려받기</button></div></div>}
    </section>
    <section className="tool-use-guide" aria-labelledby="tool-guide"><p className="editorial-label">HOW TO USE</p><h2 id="tool-guide">정리에서 다음 실행으로.</h2><ol><li><strong>질문에 답하기</strong><p>고객과 현장에 대해 알고 있는 내용을 구체적으로 적습니다.</p></li><li><strong>근거 확인하기</strong><p>추정한 내용과 확인한 내용을 구분하고 자료의 출처를 보완합니다.</p></li><li><strong>업무에 활용하기</strong><p>정리한 문서를 교육·멘토링·사업계획 검토 자료로 활용합니다.</p></li></ol><p className="tool-save-note">작성 내용은 페이지를 떠나면 사라집니다. 필요한 내용은 복사하거나 파일로 내려받아 보관하세요.</p></section>
    <section className="tool-staff" aria-labelledby="tool-staff"><h2 id="tool-staff">직원 업무 공간</h2><p>기업 진단·로드맵과 소비자 반응조사 업무는 직원 로그인 후 허용된 업무 공간에서 이어갈 수 있습니다.</p></section>
  </div>;
}
