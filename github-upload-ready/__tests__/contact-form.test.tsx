import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/components/contact-form";

describe("ContactForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the real Phase B contact fields", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText("Name or organization")).toBeVisible();
    expect(screen.getByLabelText("Email")).toBeVisible();
    expect(screen.getByLabelText("Purpose")).toBeVisible();
    expect(screen.getByLabelText("Message")).toBeVisible();
    expect(screen.getByRole("button", { name: "Send message" })).toBeVisible();
  });

  it("shows client-side validation errors", async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.getByText("Enter your name or organization.")).toBeVisible();
    expect(screen.getByText("Enter a valid email address.")).toBeVisible();
    expect(screen.getByText("Enter a message.")).toBeVisible();
  });

  it("disables while submitting and opens a modal confirmation on success", async () => {
    const user = userEvent.setup();
    let resolveRequest: (value: Response) => void = () => {};
    const pendingRequest = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockReturnValue(pendingRequest);
    render(<ContactForm />);

    await user.type(screen.getByLabelText("Name or organization"), "Campus Film Club");
    await user.type(screen.getByLabelText("Email"), "student@example.edu");
    await user.selectOptions(screen.getByLabelText("Purpose"), "event-collaboration");
    await user.type(screen.getByLabelText("Message"), "Can we plan a zine night together?");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    resolveRequest(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Message sent" })).toBeVisible()
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/contact",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })
    );
  });

  it("shows an inline failure message when the API cannot send", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: false,
          message: "We could not send your message right now."
        }),
        { status: 502 }
      )
    );
    render(<ContactForm />);

    await user.type(screen.getByLabelText("Name or organization"), "Campus Film Club");
    await user.type(screen.getByLabelText("Email"), "student@example.edu");
    await user.type(screen.getByLabelText("Message"), "Can we plan a zine night together?");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() =>
      expect(screen.getByText("We could not send your message right now.")).toBeVisible()
    );
  });
});
