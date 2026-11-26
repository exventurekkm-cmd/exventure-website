"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

export function PublicShare() {
  const path = usePathname();
  if (path !== "/" && !/^\/(about|activities|business|contact|news|privacy|tools)(\/|$)/.test(path ?? "")) return null;
  return <CopyPublicPage key={path} />;
}

function CopyPublicPage() {
  const [message, setMessage] = useState("");
  const [manual, setManual] = useState("");
  async function copy() {
    const current = new URL(window.location.href);
    const url = new URL(current.pathname, "https://exventure.co.kr");
    const interest = current.searchParams.get("interest");
    if (url.pathname === "/contact" && interest && /^[a-z-]{1,48}$/.test(interest)) url.searchParams.set("interest", interest);
    if (current.hash && document.getElementById(current.hash.slice(1))) url.hash = current.hash;
    try {
      await navigator.clipboard.writeText(url.href);
      setManual("");
      setMessage("링크를 복사했습니다.");
    } catch {
      setManual(url.href);
      setMessage("아래 주소를 선택해 복사하세요.");
    }
  }
  return <div className="public-share">
    <button type="button" onClick={copy}>이 페이지 링크 복사</button>
    <span role="status">{message}</span>
    {manual && <input aria-label="이 페이지 주소" readOnly value={manual} onFocus={e => e.currentTarget.select()} />}
  </div>;
}
