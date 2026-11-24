import { ActivitySwitch, PageHeading } from "@/components/explore-parts";
import { RecordDirectory } from "@/components/company-history-directory";
export const metadata = { title: "주요 활동", description: "교육, 워크숍, 해커톤 등 엑스벤처의 활동 기록입니다." };
export default function ActivitiesPage() {
  return <main id="main" tabIndex={-1}><PageHeading title="활동·소식" intro={metadata.description} />
    <div className="wrap content-space archive"><ActivitySwitch /><h2 className="sr-only">주요 활동</h2><RecordDirectory /></div>
  </main>;
}
