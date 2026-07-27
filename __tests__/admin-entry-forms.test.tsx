import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AdminEntryForms } from "@/components/admin-entry-forms";

describe("AdminEntryForms", () => {
  it("uses the full content width when a page has one entry form", () => {
    const { container } = render(
      <AdminEntryForms members={[]} meetings={[]} sections={["member"]} />
    );

    expect(screen.getByRole("heading", { name: "Add member" })).toBeVisible();
    expect(container.firstChild).toHaveClass("admin-entry-grid-single");
  });
});
