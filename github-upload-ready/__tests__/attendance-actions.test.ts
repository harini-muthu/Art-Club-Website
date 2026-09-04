import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordQrAttendance } from "@/app/attendance/actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  })
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn()
}));

function formData(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

function setupSupabaseMock(status: string, error: unknown = null) {
  const rpc = vi.fn(async () => ({ data: status, error }));
  vi.mocked(createClient).mockResolvedValue({ rpc } as never);
  return { rpc };
}

describe("QR attendance actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("records a valid attendee name through the public attendance RPC", async () => {
    const { rpc } = setupSupabaseMock("checked-in");

    await expect(
      recordQrAttendance(formData({ attendeeName: "Maya Chen", website: "" }))
    ).rejects.toThrow("REDIRECT:/attendance?status=checked-in");

    expect(rpc).toHaveBeenCalledWith("record_today_attendance", {
      attendee_name: "Maya Chen",
      honeypot: ""
    });
    expect(redirect).toHaveBeenCalledWith("/attendance?status=checked-in");
  });

  it("does not call Supabase when the submitted name is blank", async () => {
    const { rpc } = setupSupabaseMock("checked-in");

    await expect(
      recordQrAttendance(formData({ attendeeName: "   ", website: "" }))
    ).rejects.toThrow("REDIRECT:/attendance?status=invalid");

    expect(rpc).not.toHaveBeenCalled();
  });

  it("does not call Supabase when the hidden spam trap is filled", async () => {
    const { rpc } = setupSupabaseMock("checked-in");

    await expect(
      recordQrAttendance(formData({ attendeeName: "Maya Chen", website: "bot" }))
    ).rejects.toThrow("REDIRECT:/attendance?status=invalid");

    expect(rpc).not.toHaveBeenCalled();
  });

  it("surfaces duplicate and closed RPC results as attendance page statuses", async () => {
    const duplicate = setupSupabaseMock("already-checked-in");

    await expect(
      recordQrAttendance(formData({ attendeeName: "Maya Chen", website: "" }))
    ).rejects.toThrow("REDIRECT:/attendance?status=already-checked-in");
    expect(duplicate.rpc).toHaveBeenCalledTimes(1);

    const closed = setupSupabaseMock("closed");

    await expect(
      recordQrAttendance(formData({ attendeeName: "Maya Chen", website: "" }))
    ).rejects.toThrow("REDIRECT:/attendance?status=closed");
    expect(closed.rpc).toHaveBeenCalledTimes(1);
  });
});
