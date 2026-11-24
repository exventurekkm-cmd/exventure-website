import { ExploreTabs } from "@/components/explore-tabs";
import { PageHeading } from "@/components/explore-parts";
import { ToolWorksheet } from "@/components/startup-tools";
import { startupTools, type StartupTool } from "@/lib/public-tools";

export const metadata = { title: "창업지원 도구" };
export default function ToolsPage() {
  return <main id="main" tabIndex={-1}><PageHeading title="창업지원 도구" intro="작성한 내용을 복사하거나 텍스트 파일로 내려받을 수 있습니다." />
    <div className="wrap content-space worksheet"><ExploreTabs label="작성할 문서" panelClass="tool-panel"
      tabs={(Object.keys(startupTools) as StartupTool[]).map(id => ({ id, label: startupTools[id].title, content: <ToolWorksheet kind={id} /> }))} />
      <noscript><p>문서 생성과 내려받기는 자바스크립트를 켜고 사용할 수 있습니다.</p></noscript>
    </div></main>;
}
