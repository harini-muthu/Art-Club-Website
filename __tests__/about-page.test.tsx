import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage from "@/app/about/page";

describe("AboutPage", () => {
  it("shows meeting time instead of audience and involvement sections", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { name: "Meeting date and time" })).toBeVisible();
    expect(screen.getByText("Every Wednesday at 6:30 PM")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Who it is for" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "How to get involved" })).not.toBeInTheDocument();
  });
});
