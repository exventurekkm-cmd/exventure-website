"use client";

import { useEffect, useRef, useState, type ReactNode, type KeyboardEvent } from "react";

type Tab = { id: string; label: string; content: ReactNode };

export function ExploreTabs({ tabs, label, dark = false, panelClass }: {
  tabs: Tab[]; label: string; dark?: boolean; panelClass: string;
}) {
  const [selected, setSelected] = useState(tabs[0].id);
  const buttons = useRef<(HTMLAnchorElement | null)[]>([]);
  useEffect(() => {
    const readHash = () => {
      const id = location.hash.slice(1);
      setSelected(tabs.find(tab => tab.id === id)?.id ?? tabs[0].id);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    window.addEventListener("popstate", readHash);
    window.addEventListener("pageshow", readHash);
    return () => {
      window.removeEventListener("hashchange", readHash);
      window.removeEventListener("popstate", readHash);
      window.removeEventListener("pageshow", readHash);
    };
  }, [tabs]);
  function choose(index: number) {
    const tab = tabs[index];
    setSelected(tab.id);
    if (location.hash !== "#" + tab.id) history.replaceState(history.state, "", "#" + tab.id);
  }
  function keyDown(event: KeyboardEvent, index: number) {
    const last = tabs.length - 1;
    const dest: Record<string, number> = { Home: 0, End: last, ArrowLeft: index ? index - 1 : last, ArrowRight: index === last ? 0 : index + 1 };
    if (!Object.hasOwn(dest, event.key)) return;
    event.preventDefault();
    choose(dest[event.key]); buttons.current[dest[event.key]]?.focus();
  }
  return <>
    <nav role="tablist" aria-label={label} className={"tab-strip " + (dark ? "on-dark" : "on-paper")}>
      {tabs.map((tab, i) => <a key={tab.id} ref={el => { buttons.current[i] = el; }}
        role="tab" id={"tab-" + tab.id} href={"#" + tab.id} aria-controls={tab.id}
        aria-selected={selected === tab.id} tabIndex={selected === tab.id ? 0 : -1}
        onKeyDown={event => keyDown(event, i)} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault(); choose(i);
        }}>{tab.label}</a>)}
    </nav>
    {tabs.map(tab => <section key={tab.id} role="tabpanel" id={tab.id} aria-labelledby={"tab-" + tab.id}
      className={panelClass} tabIndex={0} hidden={selected !== tab.id} data-enter={selected === tab.id ? "" : undefined}>
      {tab.content}
    </section>)}
  </>;
}
