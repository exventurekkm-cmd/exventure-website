"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
type Chapter = { id: string; label: string };
const pageChapters: Record<string, readonly Chapter[]> = {
  "/": [{ id: "activities", label: "교육·컨설팅" }, { id: "field", label: "축제·해커톤" }, { id: "programs", label: "지원 프로그램" }],
  "/about": [{ id: "company-purpose", label: "회사 소개" }, { id: "company-facts", label: "회사 정보" }, { id: "company-history", label: "주요 이력" }],
  "/business": [{ id: "program-title", label: "지원 프로그램" }, { id: "program-method", label: "진행 방식" }],
  "/activities": [{ id: "activity-list", label: "주요 활동 목록" }],
  "/contact": [{ id: "company-contact-title", label: "회사 연락처" }],
  "/privacy": [{ id: "main", label: "개인정보 안내" }],
  "/tools": [{ id: "main", label: "직원 이용 안내" }],
  "/news": [{ id: "main", label: "소식 안내" }],
};
const detailChapters = [{ id: "record-title", label: "활동 기록" }, { id: "more-programs", label: "관련 지원 프로그램" }, { id: "related-activities", label: "다른 활동" }];
const defaultChapters = [{ id: "main", label: "페이지 안내" }];
export function ReadingNav() {
  const pathname = usePathname();
  const chapters = pageChapters[pathname] ?? (pathname.startsWith("/activities/") ? detailChapters : defaultChapters);
  const [active, setActive] = useState("activities");
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    let targets: HTMLElement[] = [];
    let frame = 0;
    const syncActive = () => {
      const entered = targets.filter(target => target.getBoundingClientRect().top < window.innerHeight * .45);
      const current = entered[entered.length - 1] ?? targets[0];
      setActive(current?.id ?? "");
    };
    const observer = new IntersectionObserver(syncActive, { rootMargin: "-100px 0px -55% 0px", threshold: 0 });
    const observeCurrentPage = () => {
      observer.disconnect();
      targets = chapters.map(chapter => document.getElementById(chapter.id)).filter((target): target is HTMLElement => Boolean(target));
      targets.forEach(target => observer.observe(target));
      syncActive();
    };
    // History restoration may replace the section nodes while the pathname stays the same.
    const restore = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(observeCurrentPage); });
    };
    observeCurrentPage();
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", restore);
    window.addEventListener("pageshow", restore);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("popstate", restore);
      window.removeEventListener("hashchange", restore);
      window.removeEventListener("pageshow", restore);
    };
  }, [pathname, chapters]);
  return <nav className="reading-nav" aria-label="이 페이지 목차">
    {chapters.map((chapter,index) => <a key={chapter.id} href={"#"+chapter.id}
      aria-current={active === chapter.id ? "location" : undefined}>
      <span aria-hidden="true">{String(index+1).padStart(2,"0")}</span>{chapter.label}
    </a>)}
  </nav>;
}
