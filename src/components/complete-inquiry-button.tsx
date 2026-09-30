"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CompleteInquiryButton({ reference }: { reference: string }) {
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  const router = useRouter();
  async function complete() {
    if (pending) return;
    setPending(true); setError("");
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(`/api/admin/inquiries/${encodeURIComponent(reference)}/complete`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: controller.signal, credentials: "same-origin" });
      const result = await response.json();
      if (!response.ok || result.ok !== true) { setError(result.message ?? "삭제를 확인하지 못했습니다."); return; }
      router.refresh();
    } catch { setError("삭제 여부를 확인하지 못했습니다. 목록을 확인하고 다시 시도해주세요."); }
    finally { clearTimeout(timer); setPending(false); }
  }
  return <div><p className="contact-hint">처리가 끝난 문의는 이름·이메일·본문과 함께 삭제합니다. 이 작업은 되돌릴 수 없습니다.</p><button className="button danger" type="button" onClick={complete} disabled={pending}>{pending ? "삭제 중…" : "처리 완료 · 문의 삭제"}</button>{error && <p role="alert" className="contact-field-error">{error}</p>}</div>;
}
