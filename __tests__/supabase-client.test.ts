import { describe, expect, it, vi } from "vitest";

const createBrowserClientMock = vi.fn(() => ({ client: "browser" }));
const createServerClientMock = vi.fn(() => ({ client: "server" }));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
  createServerClient: createServerClientMock
}));

describe("Supabase clients", () => {
  it("creates a browser client with public env config", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://tomrhagnfilqfunehrzl.supabase.co"
    );
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

    const { createClient } = await import("@/lib/supabase/client");
    const client = createClient();

    expect(client).toEqual({ client: "browser" });
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://tomrhagnfilqfunehrzl.supabase.co",
      "sb_publishable_test"
    );

    vi.unstubAllEnvs();
  });

  it("creates a server client with cookie handlers", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      "https://tomrhagnfilqfunehrzl.supabase.co"
    );
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

    const { createClient } = await import("@/lib/supabase/server");
    const client = createClient();

    expect(client).toEqual({ client: "server" });
    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://tomrhagnfilqfunehrzl.supabase.co",
      "sb_publishable_test",
      expect.objectContaining({
        cookies: expect.any(Object)
      })
    );

    vi.unstubAllEnvs();
  });
});
