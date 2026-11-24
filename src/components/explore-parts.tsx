import Link from "next/link";
import { activityRowId } from "@/lib/public-navigation";
import type { PublicActivity } from "@/lib/public-activities";

export function Breadcrumb({ label, parent }: { label: string; parent?: { href: string; label: string } }) {
  return <nav aria-label="현재 위치" className="crumb">
    <Link href="/">홈</Link><span aria-hidden="true">/</span>
    {parent && <><Link href={parent.href}>{parent.label}</Link><span aria-hidden="true">/</span></>}
    <span aria-current="page">{label}</span>
  </nav>;
}
export function PageHeading({ title, intro }: { title: string; intro?: string }) {
  return <header className="inner-head"><div className="wrap"><Breadcrumb label={title} />
    <div className="heading-line"><h1>{title}</h1>{intro && <p>{intro}</p>}</div>
  </div></header>;
}
export function ActivityRows({ records }: { records: PublicActivity[] }) {
  return <ol className="record-list">{records.map(row =>
    <li key={row.slug} id={activityRowId(row.slug)} tabIndex={-1}><Link className="record" href={"/activities/" + row.slug}>
      <time dateTime={row.date.replace(".", "-")}>{row.date}</time>
      <strong>{row.title}</strong><span className="org">{row.organization}</span>
    </Link></li>
  )}</ol>;
}
export function ActivitySwitch({ news = false }: { news?: boolean }) {
  return <nav className="section-switch" aria-label="활동과 소식">
    <Link href="/activities" aria-current={!news ? "page" : undefined}>주요 활동</Link>
    <Link href="/news" aria-current={news ? "page" : undefined}>소식</Link>
  </nav>;
}
