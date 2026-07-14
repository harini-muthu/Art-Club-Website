import { afterEach, describe, expect, it } from "vitest";
import {
  getSupabaseBrowserConfig,
  hasSupabaseBrowserConfig
} from "@/lib/supabase/config";

const originalEnv = { ...process.env };

describe("Supabase browser config", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("reads the public Supabase URL and publishable key from env", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://tomrhagnfilqfunehrzl.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";

    expect(hasSupabaseBrowserConfig()).toBe(true);
    expect(getSupabaseBrowserConfig()).toEqual({
      url: "https://tomrhagnfilqfunehrzl.supabase.co",
      publishableKey: "sb_publishable_test"
    });
  });

  it("fails clearly when Supabase env vars are missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(hasSupabaseBrowserConfig()).toBe(false);
    expect(() => getSupabaseBrowserConfig()).toThrow(
      "Supabase environment variables are not configured."
    );
  });
});
