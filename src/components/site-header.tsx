"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { accountUrl, navigation } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 961px)");
    const close = () => setOpen(false);
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  return (
    <>
    <header className="site-header" data-open={open} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <Link className="site-brand" href="/" aria-label="엑스벤처 홈페이지" onClick={() => setOpen(false)}><Brand tone="dark" /></Link>
      <button ref={toggle} className="site-menu-toggle" type="button" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(value => !value)}>
        {open ? "메뉴 닫기" : "메뉴 열기"}<span className="menu-glyph" aria-hidden="true"><i /><i /></span>
      </button>
      <nav id="site-navigation" aria-label="주 메뉴">
        {[{ href: "/", label: "홈" }, ...navigation].map((item, index) => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setOpen(false)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d={[
          "M3 10l9-7 9 7v11h-6v-7H9v7H3Z",
          "M4 21V5h10v16M14 10h6v11M8 9h2m-2 4h2m-2 4h2",
          "M4 8h16v12H4ZM8 8V4h8v4M4 13h16",
          "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l3 3m6 6 3 3M6 18l3-3m6-6 3-3M9 9h6v6H9Z",
          "M5 3h14v18H5ZM9 7h6m-6 5h6m-6 5h4",
          "M3 5h18v14H3ZM3 5l9 7 9-7",
        ][index]} /></svg>{item.label}</Link>)}
        <a className="account-link" href={accountUrl}>로그인 <span aria-hidden="true">↗</span></a>
      </nav>
      <div className="site-manifesto"><Image src="/brand/exventure-industrial-v1.png" alt="" fill sizes="266px" /><span>REAL<br />INDUSTRY<br />BIGGER<br />TOMORROW</span><i aria-hidden="true" /></div>
      <div className="site-rail-footer"><Brand tone="dark" /><small>© EXVENTURE</small></div>
    </header>
    <div className="site-topbar"><span className="topbar-motto">BUILD <i>×</i> CONNECT <i>×</i> SCALE <i>×</i> GLOBAL</span><div className="topbar-industrial" aria-hidden="true"><Image src="/brand/exventure-industrial-v1.png" alt="" fill sizes="(max-width: 640px) 120px, 360px" /></div><span className="topbar-caption">창업 교육 · 컨설팅 · 성장 지원</span></div>
    </>
  );
}

export function SkipLink() {
  return <a className="skip-link" href="#main" onClick={event => {
    const main = document.getElementById("main");
    if (main) { event.preventDefault(); main.focus(); }
  }}>본문으로 이동</a>;
}
