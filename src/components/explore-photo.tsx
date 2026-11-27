"use client";

import { useEffect, useRef } from "react";
import type { FieldPhoto } from "@/lib/field-photos";

type Props = {
  photo: FieldPhoto;
  priority?: boolean;
  sizes?: string;
};

export function ExplorePhoto({
  photo,
  priority = false,
  sizes = "(max-width: 760px) 92vw, (max-width: 1440px) 44vw, 610px",
}: Props) {
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
  }, [photo.large]);

  return <img ref={element} key={photo.large} src={photo.large}
    srcSet={`${photo.small} ${photo.width / 2}w, ${photo.large} ${photo.width}w`}
    sizes={sizes} width={photo.width} height={photo.height} alt={photo.alt} decoding="async"
    loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} />;
}
