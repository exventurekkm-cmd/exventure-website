"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { validContactEmail, type PrivacySetting } from "@/lib/inquiries/store";
export function PrivacyContactForm({ initial }: { initial: PrivacySetting }) {
  const [email, setEmail] = useState(initial.email), [saved, setSaved] = useState(initial);
  const [pending, setPending] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState(false);
  const feedback = useRef<HTMLParagraphElement>(null), router = useRouter();
  const report = (text: string, failed: boolean) => { setMessage(text); setError(failed); requestAnimationFrame(() => feedback.current?.focus()); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!validContactEmail(email.trim())) { report("공개할 이메일 주소를 확인해주세요.", true); return; }
    setPending(true); setMessage("");
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch("/api/admin/inquiries/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim(), version: saved.version }), signal: controller.signal, cache: "no-store", credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok || result.ok !== true) { report(result.message ?? "저장하지 못했습니다. 다시 시도해주세요.", true); return; }
      setSaved(result.setting); setEmail(result.setting.email);
      report("연락처를 저장했습니다. 새 문의 폼과 개인정보 안내에 반영됩니다.", false); router.refresh();
    } catch { report("저장 여부를 확인하지 못했습니다. 입력한 주소는 유지됩니다. 새로고침해 현재 설정을 확인해주세요.", true); }
    finally { clearTimeout(timer); setPending(false); }
  }
  return <form className="contact-settings-form" onSubmit={submit} noValidate aria-busy={pending}>
    <label htmlFor="privacy-contact">공개 개인정보 삭제 요청 이메일</label>
    <input id="privacy-contact" type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={254} required disabled={pending} aria-invalid={error} aria-describedby="privacy-contact-hint privacy-contact-feedback" />
    <p className="contact-hint" id="privacy-contact-hint">관리자 로그인 이메일과 별도의 설정입니다. 주소가 비어 있으면 문의 접수를 열지 않습니다.</p>
    <p id="privacy-contact-feedback" role={error ? "alert" : "status"} tabIndex={-1} ref={feedback} className={error ? "contact-field-error" : "contact-hint"}>{message || (saved.email ? `현재 저장된 주소: ${saved.email}` : "아직 저장된 연락처가 없습니다.")}</p>
    <button className="button primary" type="submit" disabled={pending}>{pending ? "저장 중…" : "연락처 저장"}</button>
  </form>;
}
