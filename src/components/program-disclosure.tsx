"use client";
import { useEffect, useRef, type ReactNode } from "react";

export function ProgramDisclosure({ children }: { children: ReactNode }) {
  const details = useRef<HTMLDetailsElement>(null);
  const ready = useRef(false);
  const save = () => {
    if (!ready.current || !details.current) return;
    try { sessionStorage.setItem("exventure:public-programs", JSON.stringify({ open: details.current.open, scrollY: window.scrollY, hash: window.location.hash })); } catch { /* Native disclosure remains available. */ }
  };
  useEffect(() => {
    let frame = 0;
    let saved: { open?: unknown; scrollY?: unknown; hash?: unknown } = {};
    try { saved = JSON.parse(sessionStorage.getItem("exventure:public-programs") ?? "{}"); } catch { /* Start with the native closed state. */ }
    if (details.current) details.current.open = saved?.open === true;
    ready.current = true;
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "back_forward" && saved?.hash === window.location.hash && typeof saved?.scrollY === "number" && Number.isFinite(saved.scrollY)) {
      const top = saved.scrollY;
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => window.scrollTo({ top, behavior: "auto" })); });
    }
    window.addEventListener("pagehide", save);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("pagehide", save); ready.current = false; };
  }, []);
  return <details ref={details} className="program-disclosure" onToggle={save} onClick={save}>{children}</details>;
}
