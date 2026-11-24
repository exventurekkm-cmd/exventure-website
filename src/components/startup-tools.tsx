"use client";

import { useRef, useState, type FormEvent } from "react";
import { createStartupNote, startupTools, type StartupTool } from "@/lib/public-tools";

export function ToolWorksheet({ kind }: { kind: StartupTool }) {
  const tool = startupTools[kind];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const output = useRef<HTMLTextAreaElement>(null);
  const completed = tool.fields.filter(f => (answers[f.key] ?? "").trim().length >= 2).length;

  function build(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    for (const field of tool.fields) {
      if ((answers[field.key] ?? "").trim().length >= 2) continue;
      const entry = document.getElementById(kind + "-" + field.key) as HTMLTextAreaElement;
      entry.setCustomValidity("공백을 제외하고 두 글자 이상 입력해주세요.");
      entry.reportValidity();
      return;
    }
    setNote(createStartupNote(kind, answers));
    setStatus("정리 문서를 만들었습니다.");
    requestAnimationFrame(() => output.current?.focus());
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(note);
      setStatus("정리 문서를 복사했습니다.");
    } catch {
      output.current?.focus(); output.current?.select();
      setStatus("내용을 선택했습니다. 복사해서 사용하세요.");
    }
  }
  function download() {
    const url = URL.createObjectURL(new Blob(["\uFEFF", note], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = tool.filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("텍스트 파일을 내려받았습니다.");
  }
  return <>
    <aside className="form-rail">
      <h2>{tool.title}</h2><p>{tool.description}</p>
      <div className="progress-block"><label htmlFor={"progress-" + kind}>작성한 항목 <span>{completed} / {tool.fields.length}</span></label>
        <progress id={"progress-" + kind} max={tool.fields.length} value={completed}>{completed} / {tool.fields.length}</progress></div>
      <p className="note">페이지를 떠나기 전에 필요한 내용을 복사하거나 내려받으세요.</p>
    </aside>
    <div className="form-surface"><form method="dialog" onSubmit={build}>
      {tool.fields.map(field => {
        const id = kind + "-" + field.key;
        return <div className="field" key={id}><label htmlFor={id}>{field.label}</label><p id={id + "-hint"}>{field.hint}</p>
          <textarea id={id} required minLength={2} maxLength={1500} rows={2} aria-describedby={id + "-hint"}
            value={answers[field.key] ?? ""} onChange={event => {
              event.target.setCustomValidity("");
              const value = event.target.value;
              setAnswers(current => ({ ...current, [field.key]: value })); setNote(""); setStatus("");
            }} /></div>;
      })}
      <button type="submit" className="action">정리 문서 만들기</button>
    </form>
    {note && <div className="result"><label htmlFor={kind + "-output"}>정리 문서</label><textarea ref={output} id={kind + "-output"} readOnly rows={10} value={note} />
      <div className="result-actions"><button className="secondary" type="button" onClick={copy}>내용 복사</button><button className="secondary" type="button" onClick={download}>텍스트 내려받기</button></div></div>}
    <p className="feedback" role="status">{status}</p></div>
  </>;
}
