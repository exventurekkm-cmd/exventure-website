"use client";

import { useEffect, useRef, useState } from "react";
import { accountUrl } from "@/lib/site";
import { CompanyLogoutButton } from "./company-logout-button";
import styles from "./employee-account.module.css";

export function EmployeeAccount() {
  const [account, setAccount] = useState<{ name: string; portal: string } | null>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const origin = window.location.origin;
    const portal = origin === "https://exventure.co.kr" ? "https://accounts.exventure.co.kr"
      : process.env.NODE_ENV === "development" && origin === "http://127.0.0.1:3003" ? "http://127.0.0.1:3002" : null;
    if (!portal) return;
    let current: AbortController;
    async function refresh() {
      if (document.hidden || !portal) return;
      current?.abort();
      const request = new AbortController();
      current = request;
      try {
        const response = await fetch(`${portal}/api/session/website`, { credentials: "include", cache: "no-store", redirect: "error", signal: request.signal });
        const data = response.ok ? await response.json() : null;
        if (!request.signal.aborted) setAccount(typeof data?.name === "string" && data.name ? { name: data.name, portal } : null);
      } catch { if (!request.signal.aborted) setAccount(null); }
    }
    function outside(event: PointerEvent) {
      if (menu.current?.open && event.target instanceof Node && !menu.current.contains(event.target)) menu.current.open = false;
    }
    void refresh();
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    document.addEventListener("pointerdown", outside);
    return () => {
      current?.abort();
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  if (!account) return <a className="frame-login" href={accountUrl}>직원 로그인</a>;
  return <details ref={menu} className={styles.menu} onKeyDown={event => {
    if (event.key === "Escape") { event.currentTarget.open = false; event.currentTarget.querySelector("summary")?.focus(); }
  }} onBlur={event => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
  }}>
    <summary className="frame-login" aria-label={`${account.name} 내 계정 메뉴`}>{account.name}</summary>
    <div className={styles.links}>
      <a href={accountUrl}>업무 홈</a>
      <a href={`${account.portal}/account`}>내 프로필</a>
      <a href={`${account.portal}/account/password`}>로그인·보안</a>
      <CompanyLogoutButton portal={account.portal} />
    </div>
  </details>;
}
