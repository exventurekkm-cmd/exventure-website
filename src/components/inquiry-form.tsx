"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { inquiryKinds, validateInquiry, type FieldErrors, type InquiryField, type InquiryPolicy, type InquiryResponse } from "@/lib/inquiries/contract";

export function InquiryForm({ policy, token, testOnly }: { policy: InquiryPolicy; token: string; testOnly: boolean }) {
  const [fields, setFields] = useState({ name: "", email: "", organization: "", kind: "", message: "" });
  const [consent, setConsent] = useState(false), [organizationConsent, setOrganizationConsent] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({}), [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false), [reference, setReference] = useState("");
  const form = useRef<HTMLFormElement>(null), summary = useRef<HTMLDivElement>(null), receipt = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (notice) summary.current?.focus(); }, [notice, errors]);
  useEffect(() => { if (reference) receipt.current?.focus(); }, [reference]);
  const labels: Record<InquiryField, string> = { name: "이름", email: "회신 이메일", organization: "회사·기관명", kind: "문의 종류", message: "문의 내용", consent: "개인정보 동의" };
  const update = (field: keyof typeof fields, value: string) => setFields(current => ({ ...current, [field]: value }));
  const describedBy = (field: InquiryField, hint?: string) => [hint, errors[field] ? `${field}-error` : ""].filter(Boolean).join(" ") || undefined;
  const fieldError = (field: InquiryField) => errors[field] ? <p id={`${field}-error`} className="contact-field-error">{errors[field]}</p> : null;
  const showError = (message: string, fieldErrors: FieldErrors = {}) => {
    setNotice(message); setErrors(fieldErrors);
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const input = { ...fields, organization: organizationConsent ? fields.organization : "", organizationConsent, consent, token, website: String(new FormData(event.currentTarget).get("website") ?? "") };
    const validation = validateInquiry(input);
    if (!validation.ok) { showError("입력 내용을 확인해주세요.", validation.errors); return; }
    setPending(true); setErrors({}); setNotice("");
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...validation.inquiry, token, website: "" }), signal: controller.signal, cache: "no-store", credentials: "same-origin" });
      const result: InquiryResponse = await response.json();
      if (!response.ok || !result.ok) { showError(result.ok ? "접수 여부를 확인하지 못했습니다. 같은 내용을 다시 제출해주세요." : result.message, result.ok ? {} : result.fieldErrors); return; }
      setReference(result.reference);
    } catch { showError("접수 여부를 확인하지 못했습니다. 작성 내용은 유지됩니다. 같은 내용을 다시 제출해주세요."); }
    finally { clearTimeout(timer); setPending(false); }
  }
  if (reference) return <section className="contact-receipt" aria-labelledby="receipt-title">
    <p className="editorial-label">RECEIVED</p>
    <h2 id="receipt-title" ref={receipt} tabIndex={-1}>{testOnly ? "테스트 문의가 저장되었습니다." : "문의가 접수되었습니다."}</h2>
    <p>{testOnly ? "가상 데이터 검증용 접수입니다. 실제 담당자에게 전달되는 문의가 아닙니다." : "문의 내용을 확인한 뒤 입력하신 이메일로 답변드리겠습니다."}</p>
    <dl><div><dt>접수번호</dt><dd>{reference}</dd></div></dl>
    <p className="contact-hint">접수번호를 보관해주세요. 이 화면에서 이메일 알림은 발송되지 않습니다.</p>
    <button type="button" className="button primary" onClick={() => window.location.reload()}>새 문의 작성 <span aria-hidden="true">↗</span></button>
  </section>;
  return <form ref={form} onSubmit={submit} noValidate className="contact-form" aria-busy={pending}>
    <p className="contact-required-note">이름·회신 이메일·문의 종류·내용과 개인정보 동의는 필수입니다.</p>
    {notice && <div className="contact-error-summary" role="alert" ref={summary} tabIndex={-1}>
      <p>{notice}</p>
      {Object.keys(errors).length > 0 && <ul>{(Object.keys(errors) as InquiryField[]).map(field => <li key={field}><a href={`#inquiry-${field}`} onClick={event => { event.preventDefault(); form.current?.querySelector<HTMLElement>(`#inquiry-${field}`)?.focus(); }}>{labels[field]}: {errors[field]}</a></li>)}</ul>}
    </div>}
    <fieldset disabled={pending} className="contact-group">
      <legend><span aria-hidden="true">01</span> 회신 정보</legend>
      <div className="contact-fields">
        <div className="contact-field"><label htmlFor="inquiry-name">이름 <span className="contact-hint">(필수)</span></label><input id="inquiry-name" name="name" autoComplete="name" value={fields.name} onChange={e => update("name", e.target.value)} maxLength={80} required aria-invalid={!!errors.name} aria-describedby={describedBy("name", "name-hint")} /><p id="name-hint" className="contact-hint">실명 인증은 하지 않습니다.</p>{fieldError("name")}</div>
        <div className="contact-field"><label htmlFor="inquiry-email">회신 이메일 <span className="contact-hint">(필수)</span></label><input id="inquiry-email" name="email" type="email" autoComplete="email" inputMode="email" value={fields.email} onChange={e => update("email", e.target.value)} maxLength={254} required aria-invalid={!!errors.email} aria-describedby={describedBy("email", "email-hint")} /><p id="email-hint" className="contact-hint">답변받을 주소를 입력해주세요.</p>{fieldError("email")}</div>
        <div className="contact-field contact-field-wide"><label htmlFor="inquiry-organization">회사·기관명 <span className="contact-hint">(선택)</span></label><input id="inquiry-organization" name="organization" autoComplete="organization" value={fields.organization} onChange={e => update("organization", e.target.value)} disabled={!organizationConsent} maxLength={120} aria-invalid={!!errors.organization} aria-describedby={describedBy("organization", "organization-hint")} /><label className="contact-checkbox"><input type="checkbox" name="organizationConsent" checked={organizationConsent} onChange={e => { setOrganizationConsent(e.target.checked); if (!e.target.checked) update("organization", ""); }} /><span>회사·기관명 수집·이용에 동의합니다. <span className="contact-hint">(선택)</span></span></label><p id="organization-hint" className="contact-hint">목적은 {policy.purpose}, 보유 기간은 문의 처리 완료까지 최대 {policy.retentionDays}일입니다. 동의하지 않아도 문의할 수 있으며 회사·기관명은 저장하지 않습니다.</p>{fieldError("organization")}</div>
      </div>
    </fieldset>
    <fieldset disabled={pending} className="contact-group">
      <legend><span aria-hidden="true">02</span> 문의 내용</legend>
      <div className="contact-field"><label htmlFor="inquiry-kind">문의 종류 <span className="contact-hint">(필수)</span></label><select id="inquiry-kind" name="kind" value={fields.kind} onChange={e => update("kind", e.target.value)} required aria-invalid={!!errors.kind} aria-describedby={describedBy("kind")}><option value="">선택해주세요</option>{inquiryKinds.map(kind => <option value={kind.value} key={kind.value}>{kind.label}</option>)}</select>{fieldError("kind")}</div>
      <div className="contact-field"><label htmlFor="inquiry-message">문의 내용 <span className="contact-hint">(필수)</span></label><textarea id="inquiry-message" name="message" value={fields.message} onChange={e => update("message", e.target.value)} rows={7} minLength={10} maxLength={3000} required aria-invalid={!!errors.message} aria-describedby={describedBy("message", "message-hint message-count")} /><div className="contact-message-help"><p id="message-hint" className="contact-hint">10~3,000자. 민감정보·주민등록번호·타인의 개인정보는 입력하지 마세요.</p><span id="message-count" className="contact-hint">{fields.message.length.toLocaleString()} / 3,000</span></div>{fieldError("message")}</div>
    </fieldset>
    <fieldset disabled={pending} className="contact-group">
      <legend><span aria-hidden="true">03</span> 개인정보 수집·이용</legend>
      <dl className="contact-policy"><div><dt>처리 주체</dt><dd>{policy.controller}</dd></div><div><dt>수집·이용 목적</dt><dd>{policy.purpose}</dd></div><div><dt>필수 항목</dt><dd>이름, 회신 이메일, 문의 종류, 문의 내용</dd></div><div><dt>보유·이용 기간</dt><dd>문의 처리 완료까지. 미종결 문의도 접수일로부터 최대 {policy.retentionDays}일.</dd></div><div><dt>동의 거부권</dt><dd>동의를 거부할 수 있습니다. 거부하면 이 폼을 통한 문의 접수가 어렵습니다.</dd></div><div><dt>삭제 요청 연락처</dt><dd><a href={`mailto:${policy.contact}`}>{policy.contact}</a></dd></div></dl>
      <p className="contact-hint">접수·동의 기록을 함께 보관합니다. 스팸 방지를 위한 해시 접속·회신주소 식별값은 최대 1시간 보관합니다.</p>
      <label className="contact-checkbox"><input id="inquiry-consent" name="consent" type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} required aria-invalid={!!errors.consent} aria-describedby={describedBy("consent")} /><span>위 필수 개인정보 수집·이용에 동의합니다. <span className="contact-hint">(필수)</span></span></label>{fieldError("consent")}
    </fieldset>
    <div className="contact-trap" aria-hidden="true"><label htmlFor="inquiry-website">웹사이트</label><input id="inquiry-website" name="website" tabIndex={-1} autoComplete="off" defaultValue="" /></div>
    <div className="contact-submit"><button type="submit" className="button primary" disabled={pending}>{pending ? "접수 중…" : testOnly ? "테스트 문의 저장" : "문의 보내기"}<span aria-hidden="true">↗</span></button><p className="contact-hint">저장이 확인되면 접수번호를 안내합니다.</p></div>
    <noscript><p>문의 접수에는 JavaScript가 필요합니다. 브라우저 설정에서 활성화한 뒤 다시 시도해주세요.</p></noscript>
  </form>;
}
