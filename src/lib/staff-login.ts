/** A return path is data, never a caller-supplied origin or an auth URL. */
export function staffReturnPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 2000 || /[%\\\x00-\x20#]/.test(value)) return "/";
  if (value === "/consulting" || value === "/consulting/") return "/consulting";
  const allowed = /^\/(?:$|roadmap(?:\/|\?|$)|workspace(?:\/|\?|$)|assignments(?:\/|\?|$)|companies(?:\/|\?|$)|mentoring(?:\/|\?|$)|research$)/;
  if (!allowed.test(value)) return "/";
  const url = new URL(value, "https://workspace.exventure.co.kr");
  if (!allowed.test(url.pathname) || /\/(?:auth|login|oauth|accounts|account)(?:\/|$)/.test(url.pathname)) return "/";
  if ([...url.searchParams.keys()].some(key => /token|code|state|redirect|next|return/i.test(key))) return "/";
  return url.pathname + url.search;
}
export function staffLoginUrl(next: unknown, local = false): URL {
  const url = new URL("/auth/staff/start", local ? "http://127.0.0.1:3000" : "https://workspace.exventure.co.kr");
  url.searchParams.set("next", staffReturnPath(next));
  return url;
}
