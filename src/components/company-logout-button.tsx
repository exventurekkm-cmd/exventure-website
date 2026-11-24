"use client";
import { useState } from "react";
export function CompanyLogoutButton({ portal }: { portal?: string }) {
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  async function logout() {
    if (pending || !window.confirm("로그아웃 하시겠습니까?\n연결된 업무와 다른 브라우저의 회사 계정 로그인도 종료됩니다.")) return;
    setPending(true); setMessage("");
    try {
      const response = portal
        ? await fetch(`${portal}/api/session/website`, { method: "POST", credentials: "include", cache: "no-store", redirect: "error" })
        : await fetch("/auth/company/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
      if (!response.ok) throw new Error("logout");
      const result = await response.json();
      if ((portal ? result.signed_out : result.ok) !== true) throw new Error("logout");
      window.location.replace(!portal && result.company_signed_out === false
        ? result.confirmation_url : "/?signed_out=1");
    } catch { setMessage("로그아웃을 확인하지 못했습니다. 다시 시도해주세요."); setPending(false); }
  }
  return <div><button className="text-link" type="button" disabled={pending} onClick={logout}>{pending ? "로그아웃 중…" : "로그아웃"}</button>{message && <p role="alert">{message}</p>}</div>;
}
