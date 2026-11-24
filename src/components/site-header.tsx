"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { navigation } from "@/lib/site";
import { EmployeeAccount } from "./employee-account";
import { Brand } from "./brand";

export function SiteHeader() {
  const path = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const current = menu.current;
    if (!current) return;
    const close = () => { current.open = false; };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !current.contains(event.target)) close();
    };
    const desktop = matchMedia("(min-width:761px)");
    close();
    desktop.addEventListener("change", close);
    window.addEventListener("pageshow", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      desktop.removeEventListener("change", close);
      window.removeEventListener("pageshow", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, [path]);
  const links = navigation.map(item => {
    const section = path.startsWith(item.href + "/") || (item.href === "/activities" && path === "/news");
    return <Link key={item.href} href={item.href} aria-current={path === item.href ? "page" : section ? "true" : undefined}>{item.label}</Link>;
  });
  return <header className="mast" id="site-header"><div className="wrap mast-inner">
    <Link className="wordmark" href="/" aria-label="엑스벤처 홈"><Brand tone="dark" /></Link>
    <nav className="main-nav" aria-label="주 메뉴">{links}</nav>
    <div className="mast-actions">
      <Link className="action small" href="/contact" aria-current={path === "/contact" ? "page" : undefined}>프로젝트 문의</Link>
      <div className="account-desktop"><EmployeeAccount /></div>
      <details className="mobile-menu" ref={menu}
        onBlur={e => { if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) e.currentTarget.open = false; }}
        onKeyDown={e => {
          if (e.key === "Escape" && !e.defaultPrevented) {
            e.currentTarget.open = false;
            e.currentTarget.querySelector("summary")?.focus();
          }
        }}>
        <summary aria-label="전체 메뉴"><span className="menu-lines" aria-hidden="true" />메뉴</summary>
        <nav className="menu-list" aria-label="전체 메뉴" onClick={e => {
          if (e.target instanceof Element && e.target.closest("a") && menu.current) menu.current.open = false;
        }}>
          <Link href="/" aria-current={path === "/" ? "page" : undefined}>홈</Link>{links}
          <Link href="/about#company-history">연혁</Link><Link href="/contact">문의</Link>
          <EmployeeAccount />
        </nav>
      </details>
    </div>
  </div></header>;
}

export function SkipLink() { return <a className="skip" href="#main">본문으로 이동</a>; }
