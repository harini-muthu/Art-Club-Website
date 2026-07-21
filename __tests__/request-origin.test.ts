import { describe, expect, it } from "vitest";
import { getAttendanceQrOrigin } from "@/lib/request-origin";

describe("request origin helpers", () => {
  it("keeps the production forwarded host and protocol", () => {
    expect(
      getAttendanceQrOrigin({
        forwardedHost: "studio.example.edu",
        forwardedProto: "https",
        host: "internal:3000"
      })
    ).toBe("https://studio.example.edu");
  });

  it("uses the LAN address when localhost would be encoded into the QR", () => {
    expect(
      getAttendanceQrOrigin({
        host: "localhost:3000",
        lanAddress: "10.16.72.61"
      })
    ).toBe("http://10.16.72.61:3000");
  });

  it("falls back to localhost when no LAN address is available", () => {
    expect(getAttendanceQrOrigin({ host: "localhost:3000" })).toBe(
      "http://localhost:3000"
    );
  });
});
