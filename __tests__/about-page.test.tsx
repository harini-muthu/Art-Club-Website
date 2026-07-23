import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AboutPage from "@/app/about/page";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}));

describe("AboutPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-key";
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(async () => ({ data: [], error: null }))
      }))
    } as never);
  });

  it("shows meeting time instead of audience and involvement sections", async () => {
    render(await AboutPage());

    expect(screen.getByRole("heading", { name: "Meeting date and time" })).toBeVisible();
    expect(screen.getByText("Every Wednesday at 6:30 PM")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Who it is for" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "How to get involved" })).not.toBeInTheDocument();
  });

  it("renders dynamic public officers without exposing private emails", async () => {
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        expect(table).toBe("public_officers");
        return {
          select: vi.fn(async () => ({
            data: [
              {
                id: "vp",
                name: "Avery Park",
                role: "VP of Events",
                focus: "Workshops",
                email: "avery@example.edu"
              },
              {
                id: "president",
                name: "Maya Chen",
                role: "President",
                focus: "Club direction",
                email: "maya@example.edu"
              }
            ],
            error: null
          }))
        };
      })
    } as never);

    render(await AboutPage());

    expect(screen.getByRole("heading", { name: "Maya Chen" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Avery Park" })).toBeVisible();
    expect(screen.queryByText("maya@example.edu")).not.toBeInTheDocument();
    expect(screen.queryByText("avery@example.edu")).not.toBeInTheDocument();
  });
});
