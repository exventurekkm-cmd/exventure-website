/** A return path is data, never a caller-supplied origin or an auth URL. */
export function staffReturnPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 2000 || /[%\\\x00-\x20#]/.test(value)) return "/";
  if (!/^\/(?:$|roadmap(?:\/|\?|$)|workspace(?:\/|\?|$)|research$)/.test(value)) return "/";
  const url = new URL(value, "https://exventure-workspace.vercel.app");
  if (!/^\/(?:$|roadmap(?:\/|$)|workspace(?:\/|$)|research$)/.test(url.pathname) || /\/(?:auth|login|oauth|accounts|account)(?:\/|$)/.test(url.pathname)) return "/";
  if ([...url.searchParams.keys()].some(key => /token|code|state|redirect|next|return/i.test(key))) return "/";
  return url.pathname + url.search;
}
export function staffLoginUrl(next: unknown, local = false): URL {
  const url = new URL("/auth/staff/start", local ? "http://127.0.0.1:3000" : "https://exventure-workspace.vercel.app");
  url.searchParams.set("next", staffReturnPath(next));
  return url;
}
