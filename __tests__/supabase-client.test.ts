import { describe, expect, it, vi } from "vitest";

const createBrowserClientMock = vi.fn(() => ({ client: "browser" }));
const createServerClientMock = vi.fn(
  (
    _url: string,
    _key: string,
    _options: {
      cookies: {
        getAll(): unknown[];
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options?: Record<string, unknown>;
          }[]
        ): void;
      };
    }
  ) => ({ client: "server" })
);
const cookieStoreMock = {
  getAll: vi.fn(() => [{ name: "sb-test", value: "cookie" }]),
  set: vi.fn()
};

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: createBrowserClientMock,
  createServerClient: createServerClientMock
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => cookieStoreMock)
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
    const client = await createClient();

    expect(client).toEqual({ client: "server" });
    expect(createServerClientMock).toHaveBeenCalledWith(
      "https://tomrhagnfilqfunehrzl.supabase.co",
      "sb_publishable_test",
      expect.objectContaining({
        cookies: expect.any(Object)
      })
    );

    const serverOptions = createServerClientMock.mock.calls[0][2];
    expect(serverOptions.cookies.getAll()).toEqual([
      { name: "sb-test", value: "cookie" }
    ]);
    serverOptions.cookies.setAll([
      { name: "sb-new", value: "value", options: { path: "/" } }
    ]);
    expect(cookieStoreMock.set).toHaveBeenCalledWith("sb-new", "value", {
      path: "/"
    });

    vi.unstubAllEnvs();
  });
});
