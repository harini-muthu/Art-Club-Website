declare module "@supabase/ssr" {
  type SupabasePayload<T> = {
    data: T | null;
    error: { message: string } | null;
  };

  type SupabaseResult<T> = Promise<SupabasePayload<T>>;

  type CookieToSet = {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  };

  type SupabaseListResult<T> = Promise<{
    data: T[] | null;
    error: { message: string } | null;
  }>;

  type SupabaseListPayload<T> = {
    count?: number | null;
    data: T[] | null;
    error: { message: string } | null;
  };

  type SupabaseQueryBuilder<T = Record<string, unknown>> = PromiseLike<
    SupabaseListPayload<T>
  > & {
    delete(): SupabaseFilterBuilder<T>;
    insert(row: unknown): SupabaseMutationBuilder<T>;
    select(
      columns: string,
      options?: { count?: string; head?: boolean }
    ): SupabaseQueryBuilder<T>;
    eq(column: string, value: string): SupabaseQueryBuilder<T>;
    order(
      column: string,
      options?: { ascending?: boolean }
    ): SupabaseListResult<T>;
    single(): SupabaseResult<T>;
    update(row: unknown): SupabaseFilterBuilder<T>;
  };

  type SupabaseFilterBuilder<T = Record<string, unknown>> = {
    eq(column: string, value: string): SupabaseResult<T>;
  };

  type SupabaseMutationBuilder<T = Record<string, unknown>> =
    PromiseLike<SupabasePayload<T>> & {
      select(columns: string): SupabaseQueryBuilder<T>;
    };

  type SupabaseStorageBucket = {
    getPublicUrl(path: string): { data: { publicUrl: string } };
    remove(paths: string[]): Promise<{
      data: unknown[] | null;
      error: { message: string } | null;
    }>;
    upload(
      path: string,
      file: File,
      options?: { contentType?: string; upsert?: boolean }
    ): Promise<{
      data: { path: string } | null;
      error: { message: string } | null;
    }>;
  };

  type SupabaseStorageClient = {
    from(bucket: string): SupabaseStorageBucket;
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
    rpc<T = unknown>(
      fn: string,
      args?: Record<string, unknown>
    ): Promise<SupabasePayload<T>>;
    storage: SupabaseStorageClient;
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
