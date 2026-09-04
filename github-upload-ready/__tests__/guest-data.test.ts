import { describe, expect, it } from "vitest";
import {
  filterGuestsBySearch,
  getGuestAttendanceCount,
  normalizeGuestName
} from "@/lib/guest-data";

describe("guest data helpers", () => {
  it("normalizes names case-insensitively for guest matching", () => {
    expect(normalizeGuestName("  Maya   CHEN ")).toBe("maya chen");
  });

  it("counts attendance records linked to a guest", () => {
    expect(getGuestAttendanceCount("guest-1", [
      { guest_id: "guest-1" },
      { guest_id: "guest-2" },
      { guest_id: "guest-1" }
    ])).toBe(2);
  });

  it("filters active guests by name or notes", () => {
    expect(filterGuestsBySearch([
      { id: "guest-1", full_name: "Maya Chen", notes: "First meeting" },
      { id: "guest-2", full_name: "Avery Park", notes: "Bring sketchbook" }
    ], "sketch")).toEqual([
      { id: "guest-2", full_name: "Avery Park", notes: "Bring sketchbook" }
    ]);
  });
});
