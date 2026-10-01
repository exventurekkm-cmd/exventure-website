"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { accountUrl, navigation } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <header className="site-header" data-open={open} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    }}>
      <Link className="site-brand" href="/" aria-label="엑스벤처 홈페이지" onClick={() => setOpen(false)}><Brand /></Link>
      <button ref={toggle} className="site-menu-toggle" type="button" aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}>
        {open ? "메뉴 닫기" : "메뉴 열기"}<span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <nav id="site-navigation" aria-label="주 메뉴">
        {navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}</Link>)}
        <a className="account-link" href={accountUrl}>로그인 <span aria-hidden="true">↗</span></a>
      </nav>
    </header>
  );
}
