import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AttendanceQrPanel } from "@/components/attendance-qr-panel";

describe("AttendanceQrPanel", () => {
  it("renders a QR code and public attendance link for officers", () => {
    render(<AttendanceQrPanel origin="https://studio.example.edu" />);

    expect(
      screen.getByRole("heading", { name: "Today's attendance QR" })
    ).toBeVisible();
    expect(screen.getByLabelText("QR code for attendance check-in")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open check-in page" })).toHaveAttribute(
      "href",
      "https://studio.example.edu/attendance"
    );
    expect(screen.getByText("https://studio.example.edu/attendance")).toBeVisible();
  });
});
