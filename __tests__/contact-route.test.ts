import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/contact/route";

const envBackup = { ...process.env };
const fetchMock = vi.fn();

const validPayload = {
  nameOrOrganization: "Campus Film Club",
  email: "student@example.edu",
  purpose: "event-collaboration",
  message: "We would like to collaborate on a zine night.",
  website: ""
};

function requestFor(payload: unknown) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    process.env = {
      ...envBackup,
      RESEND_API_KEY: "test-key",
      CONTACT_TO_EMAIL: "club@example.edu",
      CONTACT_FROM_EMAIL: "Studio Collective <contact@example.edu>",
      CONTACT_REPLY_NAME: "Studio Collective"
    };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "email-id" }), { status: 200 })
    );
  });

  afterEach(() => {
    process.env = envBackup;
    vi.unstubAllGlobals();
  });

  it("sends a club notification and requester auto-reply for valid contact requests", async () => {
    const response = await POST(requestFor(validPayload));

    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.resend.com/emails");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer test-key",
        "Content-Type": "application/json"
      }
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      from: "Studio Collective <contact@example.edu>",
      to: ["club@example.edu"],
      reply_to: "student@example.edu",
      subject: "Studio Collective contact: Event/collaboration"
    });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      from: "Studio Collective <contact@example.edu>",
      to: ["student@example.edu"],
      subject: "We received your Studio Collective message"
    });
  });

  it("returns validation errors and does not send email for invalid requests", async () => {
    const response = await POST(
      requestFor({ ...validPayload, email: "bad", website: "filled" })
    );

    await expect(response.json()).resolves.toEqual({
      ok: false,
      fieldErrors: {
        email: "Enter a valid email address.",
        website: "Unable to send this request."
      }
    });
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails gracefully when required email config is missing", async () => {
    delete process.env.RESEND_API_KEY;

    const response = await POST(requestFor(validPayload));

    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: "Email sending is not configured yet. Please email the club directly."
    });
    expect(response.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails gracefully when the email provider rejects a send", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "provider down" }), {
        status: 500
      })
    );

    const response = await POST(requestFor(validPayload));

    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: "We could not send your message right now. Please try again or email the club directly."
    });
    expect(response.status).toBe(502);
  });
});
