"use client";

import Link, { useLinkStatus } from "next/link";
import { useState, type ComponentProps } from "react";

function NavigationStatus() {
  const { pending } = useLinkStatus();
  return <><span className="navigation-pending" data-pending={pending} aria-hidden="true" /><span className="sr-only" role="status">{pending ? "화면을 불러오는 중" : ""}</span></>;
}

/** Prefetch only after pointer/keyboard intent; large directories stay quiet. */
export function NavigationLink({ children, className = "", prefetch, onMouseEnter, onFocus, ...props }: ComponentProps<typeof Link>) {
  const [intent, setIntent] = useState(false);
  return <Link {...props} className={`exv-navigation-link ${className}`} prefetch={prefetch ?? (intent ? null : false)}
    onMouseEnter={event => { setIntent(true); onMouseEnter?.(event); }}
    onFocus={event => { setIntent(true); onFocus?.(event); }}>
    {children}<NavigationStatus />
  </Link>;
}
