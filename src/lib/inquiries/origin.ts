/** Match the public origin exactly. Only the explicit loopback fixture may use Next's internal localhost URL. */
export function sameOriginRequest(request: Request, origin: string, localTest = false): boolean {
  if (request.headers.get("origin") !== origin || (request.headers.has("sec-fetch-site") && request.headers.get("sec-fetch-site") !== "same-origin")) return false;
  const expected = new URL(origin), transport = new URL(request.url);
  if (transport.origin === origin) return true;
  // Next reconstructs local route-handler URLs using localhost even when the browser uses 127.0.0.1.
  // Require the actual Host, HTTP scheme and port; never trust forwarded-host/proto or allow this on hosted runtimes.
  return localTest && expected.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(expected.hostname)
    && transport.protocol === "http:" && transport.hostname === "localhost" && transport.port === expected.port
    && request.headers.get("host") === expected.host;
}
