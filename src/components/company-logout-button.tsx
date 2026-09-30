"use client";
import { useState } from "react";
export function CompanyLogoutButton() {
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  async function logout() {
    setPending(true); setMessage("");
    try {
      const response = await fetch("/auth/company/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
      if (!response.ok || (await response.json()).ok !== true) throw new Error("logout");
      window.location.assign("/admin/login");
    } catch { setMessage("로그아웃을 확인하지 못했습니다. 다시 시도해주세요."); setPending(false); }
  }
  return <div><button className="text-link" type="button" disabled={pending} onClick={logout}>{pending ? "로그아웃 중…" : "로그아웃"}</button>{message && <p role="alert">{message}</p>}</div>;
}
