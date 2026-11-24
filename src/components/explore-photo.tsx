"use client";

import { useEffect, useRef } from "react";
import type { Program } from "@/lib/explore";

const photos = {
  workshop: { large: "/review/editorial/workshop-1500.webp", small: "/review/editorial/workshop-750.webp", w: 1500, h: 1000, alt: "창가에 둘러앉아 이야기를 나누는 사람들" },
  planning: { large: "/review/editorial/planning-1500.webp", small: "/review/editorial/planning-750.webp", w: 1500, h: 1125, alt: "종이에 아이디어와 화면 구성을 스케치하는 손" },
  teamwork: { large: "/review/samples/teamwork-1400.webp", small: "/review/samples/teamwork-700.webp", w: 1400, h: 933, alt: "작업 테이블에서 자료를 함께 검토하는 사람들" },
  presentation: { large: "/review/samples/presentation-1400.webp", small: "/review/samples/presentation-700.webp", w: 1400, h: 933, alt: "무대에서 진행되는 발표를 보는 청중" },
  global: { large: "/brand/explore-global.svg", small: "", w: 900, h: 600, alt: "지구 위에 표시한 해외 연결 경로" },
  prototype: { large: "/brand/explore-prototype.svg", small: "", w: 900, h: 600, alt: "제품 구성을 표현한 개념도" },
};

export function ExplorePhoto({ photo, priority = false }: { photo: Program["photo"]; priority?: boolean }) {
  const image = photos[photo];
  const element = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const node = element.current;
    if (!node) return;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    function scheduleRetry() {
      if (!node || timer !== undefined || attempts >= 2) return;
      const url = new URL(node.currentSrc || node.src);
      url.searchParams.set("image_retry", String(++attempts));
      timer = setTimeout(() => {
        timer = undefined;
        node.removeAttribute("srcset");
        node.src = url.href;
      }, attempts * 650);
    }
    node.addEventListener("error", scheduleRetry);
    // A cached failure can complete before React attaches its event handlers.
    if (node.complete && node.currentSrc && !node.naturalWidth) scheduleRetry();
    return () => { clearTimeout(timer); node.removeEventListener("error", scheduleRetry); };
  }, [photo]);

  return <img ref={element} key={photo} src={image.large} className={image.small ? undefined : "illustration"}
    srcSet={image.small ? image.small + " " + image.w / 2 + "w, " + image.large + " " + image.w + "w" : undefined}
    sizes="(max-width: 760px) 100vw, (max-width: 1440px) 48vw, 680px"
    width={image.w} height={image.h} alt={image.alt} decoding="async"
    loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />;
}
