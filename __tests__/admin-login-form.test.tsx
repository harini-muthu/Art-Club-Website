import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminLoginForm } from "@/app/admin/login/login-form";
import { createClient } from "@/lib/supabase/client";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock
  })
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn()
}));

describe("AdminLoginForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a friendly error and re-enables submit when Supabase setup throws", async () => {
    const user = userEvent.setup();
    vi.mocked(createClient).mockImplementation(() => {
      throw new Error("Supabase environment variables are not configured.");
    });

    render(<AdminLoginForm />);

    await user.type(screen.getByLabelText("Email"), "officer@example.edu");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(
        screen.getByText("We could not sign you in right now. Try again in a moment.")
      ).toBeVisible()
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates to admin after successful login", async () => {
    const user = userEvent.setup();
    vi.mocked(createClient).mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: null },
          error: null
        })),
        signInWithPassword: vi.fn(async () => ({ error: null })),
        signOut: vi.fn(async () => ({ error: null }))
      },
      from: vi.fn()
    } as ReturnType<typeof createClient>);

    render(<AdminLoginForm />);

    await user.type(screen.getByLabelText("Email"), "officer@example.edu");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/admin"));
    expect(refreshMock).toHaveBeenCalled();
  });
});
