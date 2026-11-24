"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { companyHistory } from "@/lib/company-profile";
import { publicActivities } from "@/lib/public-activities";
import { activityRowId, historyRecordId } from "@/lib/public-navigation";
import { ActivityRows } from "./explore-parts";

export function RecordDirectory({ history = false }: { history?: boolean }) {
  const records = history ? companyHistory : publicActivities;
  const noun = history ? "이력" : "활동";
  const yearLabel = history ? "history-year" : "activity-year";
  const storeKey = "exventure:public-" + (history ? "history" : "activities");
  const [query, setQuery] = useState(""), [year, setYear] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let previous: {query?: string; year?: string} = {};
    try { previous = JSON.parse(sessionStorage.getItem(storeKey) || "{}") || {}; } catch { /* Optional search state. */ }
    setQuery(typeof previous.query === "string" ? previous.query.slice(0, 200) : "");
    setYear(records.some(row => row.date.slice(0, 4) === previous.year) ? previous.year! : "");
    setReady(true);
    let frame = 0;
    function openAnchor() {
      const id = location.hash.slice(1);
      const record = history ? companyHistory.find(row => historyRecordId(row.date) === id)
        : publicActivities.find(row => activityRowId(row.slug) === id);
      if (!record) return;
      setQuery(""); setYear("");
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = document.getElementById(id);
        target?.scrollIntoView({block: "start"}); target?.focus({preventScroll:true});
      });
    }
    openAnchor();
    window.addEventListener("hashchange", openAnchor);
    window.addEventListener("pageshow", openAnchor);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hashchange", openAnchor);
      window.removeEventListener("pageshow", openAnchor);
    };
  }, [storeKey, history, records]);
  useEffect(() => {
    if (ready) try { sessionStorage.setItem(storeKey, JSON.stringify({query, year})); } catch { /* A blocked store does not affect search. */ }
  }, [ready, query, year, storeKey]);

  const keywords = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = (row: { date: string; title: string; organization: string }) =>
    (!year || row.date.startsWith(year)) && keywords.every(word => (row.title + " " + row.organization).toLocaleLowerCase().includes(word));
  const visible = records.filter(matches);
  const reset = () => { setQuery(""); setYear(""); };
  return <div>
    <div className="filterbar" hidden={!ready}>
      <label><span>사업명·기관 검색</span><input type="search" maxLength={200} placeholder="사업명 또는 기관명" value={query} onChange={e => setQuery(e.target.value)} /></label>
      <label><span id={yearLabel}>연도</span><select aria-labelledby={yearLabel} value={year} onChange={e => setYear(e.target.value)}><option value="">전체 연도</option>
        {[...new Set(records.map(row => row.date.slice(0,4)))].map(y => <option value={y} key={y}>{y}년</option>)}</select></label>
      <button type="button" className="subtle" onClick={reset} disabled={!year && !query}>초기화</button>
    </div>
    <p className="search-status" role="status">{noun} {visible.length}건</p>
    {history ? <ol className="history-list">{visible.map(row => {
      const activity = publicActivities.find(a => a.date === row.date);
      return <li key={row.date} id={historyRecordId(row.date)} tabIndex={-1}>
        <time dateTime={row.date.replace(".", "-")}>{row.date}</time><div>
        {activity ? <Link href={"/activities/" + activity.slug}>{row.title}</Link> : <strong>{row.title}</strong>}
        {row.organization && <p>{row.organization}</p>}</div>
      </li>;
    })}</ol> : <div id="activity-list"><ActivityRows records={publicActivities.filter(matches)} /></div>}
    {visible.length === 0 && <div className="empty-result"><p>조건에 맞는 {history ? "이력이" : "활동이"} 없습니다.</p>
      <button type="button" className="secondary" onClick={reset}>전체 {noun} 보기</button></div>}
  </div>;
}
