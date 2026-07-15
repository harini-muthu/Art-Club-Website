declare module "@supabase/ssr" {
  type SupabaseResult<T> = Promise<{
    data: T | null;
    error: { message: string } | null;
  }>;

  type CookieToSet = {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  };

  type SupabaseListResult<T> = Promise<{
    data: T[] | null;
    error: { message: string } | null;
  }>;

  type SupabaseQueryBuilder<T = Record<string, unknown>> = {
    select(columns: string): SupabaseQueryBuilder<T>;
    eq(column: string, value: string): SupabaseQueryBuilder<T>;
    order(
      column: string,
      options?: { ascending?: boolean }
    ): SupabaseListResult<T>;
    single(): SupabaseResult<T>;
  };

  type SupabaseClient = {
    auth: {
      getUser(): Promise<{
        data: { user: { id: string; email?: string } | null };
        error: { message: string } | null;
      }>;
      signInWithPassword(credentials: {
        email: string;
        password: string;
      }): Promise<{ error: { message: string } | null }>;
      signOut(): Promise<{ error: { message: string } | null }>;
    };
    from<T = Record<string, unknown>>(table: string): SupabaseQueryBuilder<T>;
  };

  export function createBrowserClient(
    supabaseUrl: string,
    supabaseKey: string
  ): SupabaseClient;

  export function createServerClient(
    supabaseUrl: string,
    supabaseKey: string,
    options: {
      cookies: {
        getAll(): unknown[];
        setAll(cookiesToSet: CookieToSet[]): void;
      };
    }
  ): SupabaseClient;
}
