"use client";
import { useEffect, useState } from "react";
import { companyHistory, companyProfile } from "@/lib/company-profile";
import { publicActivities } from "@/lib/public-activities";
import { historyRecordId } from "@/lib/public-navigation";

export function CompanyHistoryDirectory() {
  const [query, setQuery] = useState(""),
    [year, setYear] = useState("");
  const [ready, setReady] = useState(false);
  const saveState = () => {
    if (!ready) return;
    const open = Array.from(document.querySelectorAll<HTMLLIElement>(".company-history > li")).filter(item => item.querySelector("details")?.open).map(item => item.id);
    try { sessionStorage.setItem("exventure:public-history", JSON.stringify({ query, year, open, scrollY: window.scrollY, hash: window.location.hash })); } catch { /* Browsing still works when storage is unavailable. */ }
  };
  useEffect(() => {
    let frame = 0;
    let saved: { query?: unknown; year?: unknown; open?: unknown; scrollY?: unknown; hash?: unknown } = {};
    try { saved = JSON.parse(sessionStorage.getItem("exventure:public-history") ?? "{}"); } catch { /* Use the visible default list. */ }
    setQuery(typeof saved?.query === "string" ? saved.query.slice(0, 200) : "");
    setYear(typeof saved?.year === "string" && companyHistory.some(item => item.date.slice(0, 4) === saved.year) ? saved.year : "");
    setReady(true);
    const savedOpen = Array.isArray(saved?.open) ? saved.open.filter((id): id is string => typeof id === "string" && companyHistory.some(item => historyRecordId(item.date) === id)) : [];
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
      savedOpen.forEach(id => { const details = document.getElementById(id)?.querySelector("details"); if (details) details.open = true; });
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (navigation?.type === "back_forward" && saved?.hash === window.location.hash && typeof saved?.scrollY === "number" && Number.isFinite(saved.scrollY)) window.scrollTo({ top: saved.scrollY, behavior: "auto" });
    }); });
    const revealRecord = () => {
      const id = window.location.hash.slice(1);
      if (!companyHistory.some(item => historyRecordId(item.date) === id)) return;
      setQuery(""); setYear("");
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
        const target = document.getElementById(id);
        const details = target?.querySelector("details");
        if (details) details.open = true;
        target?.scrollIntoView({ block: "start" });
        target?.focus({ preventScroll: true });
      }); });
    };
    revealRecord();
    window.addEventListener("hashchange", revealRecord);
    window.addEventListener("popstate", revealRecord);
    window.addEventListener("pageshow", revealRecord);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", revealRecord);
      window.removeEventListener("popstate", revealRecord);
      window.removeEventListener("pageshow", revealRecord);
    };
  }, []);
  useEffect(() => {
    saveState();
    window.addEventListener("pagehide", saveState);
    return () => window.removeEventListener("pagehide", saveState);
  }, [query, year, ready]);
  const terms = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const visible = companyHistory.filter(
    (item) =>
      (!year || item.date.startsWith(year)) &&
      terms.every((term) =>
        `${item.title} ${item.organization}`.toLocaleLowerCase().includes(term),
      ),
  );
  return (
    <div className="history-directory">
      <div className="history-controls">
        <label>
          <span>사업명·기관 검색</span>
          <input
            type="search"
            value={query}
            maxLength={200}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="교육, 컨설팅 또는 기관명"
          />
        </label>
        <label>
          <span>기준 연도</span>
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">전체 연도</option>
            {[
              ...new Set(companyHistory.map((item) => item.date.slice(0, 4))),
            ].map((value) => (
              <option key={value} value={value}>
                {value}년
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="history-reset"
          disabled={!query && !year}
          onClick={() => {
            setQuery("");
            setYear("");
          }}
        >
          조건 초기화
        </button>
      </div>
      <p className="history-result" role="status">
        {year || "전체 연도"} · {query ? `‘${query}’ 검색` : "검색 조건 없음"} ·{" "}
        {visible.length} / {companyHistory.length}개 이력
      </p>
      <ol className="company-history">
        {visible.map(item => {
          const activity = publicActivities.find(activity => activity.title === item.title && activity.date === item.date);
          return (
          <li key={item.date + item.title} id={historyRecordId(item.date)} tabIndex={-1}>
            <time dateTime={item.date.replace(".", "-")}>{item.date}</time>
            <details onToggle={saveState}>
              <summary>
                {item.title}
                <span aria-hidden="true">+</span>
              </summary>
              {item.organization && (
                <p className="history-organization">{item.organization}</p>
              )}
              <p className="company-source">
                {companyProfile.sourceLabel} · 주요 이력
              </p>
              {activity && <a className="editorial-link" href={"/activities/"+activity.slug} onClick={saveState}>활동 기록 보기 <span aria-hidden="true">↗</span></a>}
              <a className="editorial-link" href="/contact" onClick={saveState}>문의 안내 <span aria-hidden="true">↗</span></a>
            </details>
          </li>
        );})}
      </ol>
      {!visible.length && (
        <div className="history-empty">
          <h3>조건에 맞는 이력이 없습니다.</h3>
          <p>검색어를 바꾸거나 연도 조건을 초기화해 주세요.</p>
          <button
            type="button"
            className="history-reset"
            onClick={() => {
              setQuery("");
              setYear("");
            }}
          >
            전체 이력 보기
          </button>
        </div>
      )}
    </div>
  );
}
