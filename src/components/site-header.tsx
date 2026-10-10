"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { accountUrl } from "@/lib/site";

const publicNavigation = [
  { href: "/", label: "홈", path: "M3 10l9-7 9 7v11h-6v-7H9v7H3Z" },
  { href: "/about", label: "회사 소개", path: "M4 21V5h10v16M14 10h6v11M8 9h2m-2 4h2m-2 4h2" },
  { href: "/business", label: "사업 영역", path: "M4 8h16v12H4ZM8 8V4h8v4M4 13h16" },
  { href: "/activities", label: "주요 활동", path: "M4 5h16v15H4ZM8 9h8m-8 4h8m-8 4h5" },
  { href: "/about#company-history", label: "연혁", path: "M5 3h14v18H5ZM9 7h6m-6 5h6m-6 5h4" },
  { href: "/contact", label: "문의", path: "M3 5h18v14H3ZM3 5l9 7 9-7" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hash, setHash] = useState("");
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const sync = () => { setOpen(false); setHash(window.location.hash); };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    window.addEventListener("pageshow", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
      window.removeEventListener("pageshow", sync);
    };
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [open]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 961px)");
    const close = () => setOpen(false);
    desktop.addEventListener("change", close);
    return () => desktop.removeEventListener("change", close);
  }, []);
  const historyActive = pathname === "/about" && (hash === "#company-history" || hash.startsWith("#history-"));
  const currentHref = pathname.startsWith("/activities") ? "/activities" : historyActive ? "/about#company-history" : pathname;
  const closeAndFocus = () => { setOpen(false); toggle.current?.focus(); };
  return <>
    <header className="site-header" data-open={open} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); } }}>
      <a className="site-brand" href="/" aria-label="엑스벤처 홈페이지" onClick={() => setOpen(false)}><Brand tone="dark" /></a>
      <button ref={toggle} className="site-menu-toggle" type="button" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(value => !value)}>{open ? "메뉴 닫기" : "메뉴 열기"}<span className="menu-glyph" aria-hidden="true"><i /><i /></span></button>
      <nav id="site-navigation" aria-label="주 메뉴">{publicNavigation.map(item => <a key={item.href} href={item.href} aria-current={currentHref === item.href ? "page" : undefined} onClick={() => setOpen(false)}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d={item.path} /></svg>{item.label}</a>)}</nav>
      <div className="site-manifesto"><Image src="/brand/exventure-industrial-v1.png" alt="" fill sizes="768px" /></div>
      <div className="site-rail-footer"><a href="/" aria-label="엑스벤처 홈으로"><Brand tone="dark" /></a><small>© EXVENTURE<br />All rights reserved.</small></div>
    </header>
    {open && <button type="button" className="mobile-menu-backdrop" tabIndex={-1} aria-label="메뉴 바깥 영역 닫기" onPointerDown={event => event.preventDefault()} onClick={closeAndFocus} />}
    <div className="site-topbar"><div className="topbar-industrial" aria-hidden="true"><Image src="/brand/exventure-industrial-v1.png" alt="" fill sizes="360px" /></div><a className="frame-login" href={accountUrl}>로그인 <span aria-hidden="true">↗</span></a></div>
  </>;
}

export function SkipLink() {
  return <a className="skip-link" href="#main" onClick={event => { const main = document.getElementById("main"); if (main) { event.preventDefault(); main.focus(); main.scrollIntoView({ block: "start" }); } }}>본문으로 이동</a>;
}
