import type { Metadata } from "next";
import type { workEntries } from "./work-entries";

type Artwork = "home" | "company" | (typeof workEntries)[number]["slug"];

export const websiteOrigin = "https://exventure.co.kr";
export const shortOrigin = "https://exven.co.kr";

export function pageMetadata(title: string, description: string, url: string, artwork: Artwork = "company") {
  const canonical = new URL(url, websiteOrigin).href;
  const displayTitle = title + " | 엑스벤처";
  const image = {
    url: websiteOrigin + "/brand/share-" + (artwork === "respond" ? "research" : artwork === "modoo" ? "work" : artwork) + ".jpg",
    width: 1200,
    height: 630,
    alt: artwork === "company" ? "엑스벤처 공식 홈페이지" : title + " · 엑스벤처",
  };
  return {
    title, description,
    alternates: { canonical },
    openGraph: { type: "website", locale: "ko_KR", siteName: "엑스벤처", url: canonical, title: displayTitle, description, images: [image] },
    twitter: { card: "summary_large_image", title: displayTitle, description, images: [image] },
  } satisfies Metadata;
}
