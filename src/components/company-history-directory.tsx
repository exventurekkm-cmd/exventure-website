"use client";
import Link from "next/link";
import { useState } from "react";
import { companyHistory, companyProfile } from "@/lib/company-profile";

export function CompanyHistoryDirectory() {
  const [query, setQuery] = useState(""),
    [year, setYear] = useState("");
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
        {visible.map((item) => (
          <li key={item.date + item.title}>
            <time dateTime={item.date.replace(".", "-")}>{item.date}</time>
            <details>
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
              <Link className="editorial-link" href="/contact">
                관련 협업 문의 <span aria-hidden="true">↗</span>
              </Link>
            </details>
          </li>
        ))}
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
