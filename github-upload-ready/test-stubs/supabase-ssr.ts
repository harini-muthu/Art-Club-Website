export function createBrowserClient(url: string, publishableKey: string) {
  return { publishableKey, type: "browser", url };
}

export function createServerClient(
  url: string,
  publishableKey: string,
  options: unknown
) {
  return { options, publishableKey, type: "server", url };
}
