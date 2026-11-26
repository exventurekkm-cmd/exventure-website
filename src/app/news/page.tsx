import Link from "next/link";
import { ActivitySwitch, PageHeading } from "@/components/explore-parts";
import { pageMetadata } from "@/lib/share-metadata";
export const metadata = pageMetadata("소식", "엑스벤처의 새로운 소식을 확인하세요.", "/news");
export default function NewsPage() {
  return <main id="main" tabIndex={-1}><PageHeading title="활동·소식" />
    <div className="wrap content-space archive"><ActivitySwitch news />
      <section className="news-empty"><h2>소식</h2><p>아직 등록된 소식이 없습니다.</p><Link className="secondary" href="/activities">주요 활동 보기</Link></section>
    </div></main>;
}
