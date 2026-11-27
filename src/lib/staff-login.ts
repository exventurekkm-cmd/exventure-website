/** A return path is data, never a caller-supplied origin or an auth URL. */
export function staffReturnPath(value: unknown): string {
  if (typeof value !== "string" || value.length > 2000 || /[\\\x00-\x20#]/.test(value)) return "/";
  if (value.includes("%")) {
    const delimiter = value.indexOf("?");
    const pathname = value.slice(0, delimiter);
    const fields = value.slice(delimiter + 1).split("&");
    // Research search terms can contain Korean. Encoded paths and control parameters stay excluded.
    if (delimiter < 0 || !/^\/(?:research|workspace)(?:\/|$)/.test(pathname) || pathname.includes("%")
      || /%(?![0-9a-f]{2})|%(?:0[0-9a-f]|1[0-9a-f]|7f)/i.test(value) || fields.some(field => field.includes("%") && !field.startsWith("q="))) return "/";
  }
  if (value === "/consulting" || value === "/consulting/") return "/consulting";
  const allowed = /^\/(?:$|roadmap(?:\/|\?|$)|workspace(?:\/|\?|$)|assignments(?:\/|\?|$)|companies(?:\/|\?|$)|mentoring(?:\/|\?|$)|buyer-bridge(?:\/|\?|$)|research(?:\/|\?|$))/;
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
