declare module "@supabase/ssr" {
  export function createBrowserClient(
    supabaseUrl: string,
    supabaseKey: string
  ): unknown;

  export function createServerClient(
    supabaseUrl: string,
    supabaseKey: string,
    options: {
      cookies: {
        getAll(): unknown[];
        setAll(cookiesToSet: unknown[]): void;
      };
    }
  ): unknown;
}
