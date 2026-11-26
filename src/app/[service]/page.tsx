import { notFound } from "next/navigation";
import { OpenWorkEntry } from "@/components/open-work-entry";
import { pageMetadata, shortOrigin } from "@/lib/share-metadata";
import { workEntries, workEntry } from "@/lib/work-entries";

type Props = { params: Promise<{ service: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return workEntries.map(({ slug }) => ({ service: slug }));
}

async function readEntry({ params }: Props) {
  const { service } = await params;
  return workEntry(service) ?? notFound();
}

export async function generateMetadata(props: Props) {
  const entry = await readEntry(props);
  return { ...pageMetadata(entry.title, entry.description, shortOrigin + "/" + entry.slug, entry.slug), referrer: "no-referrer" as const };
}

export default async function WorkEntryPage(props: Props) {
  const entry = await readEntry(props);
  return <main id="main" tabIndex={-1} className="wrap content-space work-entry">
    <h1>{entry.title}</h1>
    <p>{entry.description}</p>
    <a className="action" href={entry.destination} rel="noreferrer">{entry.title} 열기</a>
    <OpenWorkEntry destination={entry.destination} />
  </main>;
}
