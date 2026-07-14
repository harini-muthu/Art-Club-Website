import { createServerClient } from "@supabase/ssr";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";

export function createClient() {
  const { url, publishableKey } = getSupabaseBrowserConfig();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Server cookie writes will be wired when admin auth is implemented.
      }
    }
  });
}
