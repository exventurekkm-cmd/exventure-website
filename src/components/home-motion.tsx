"use client";
import { useEffect } from "react";

/** One quiet entrance per section. The server-rendered page is visible without JS. */
export function HomeMotion() {
  useEffect(() => {
    const root = document.querySelector(".home-page");
    if (!root || !("IntersectionObserver" in window)) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const reveal = (element: HTMLElement) => {
      element.classList.add("is-revealed");
      observer?.unobserve(element);
    };
    const clear = () => {
      observer?.disconnect();
      elements.forEach(element => element.classList.remove("reveal-pending", "is-revealed"));
    };
    const start = () => {
      clear();
      if (preference.matches) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target as HTMLElement); });
      }, { threshold: 0.08 });
      elements.forEach(element => {
        // Never hide the current viewport, including an initial deep link.
        if (element.getBoundingClientRect().top >= window.innerHeight) {
          element.classList.add("reveal-pending");
          observer?.observe(element);
        }
      });
    };
    const handleFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) {
        const element = event.target.closest<HTMLElement>(".reveal-pending");
        if (element) reveal(element);
      }
    };
    start();
    preference.addEventListener("change", start);
    root.addEventListener("focusin", handleFocus as EventListener);
    return () => {
      clear();
      preference.removeEventListener("change", start);
      root.removeEventListener("focusin", handleFocus as EventListener);
    };
  }, []);
  return null;
}
