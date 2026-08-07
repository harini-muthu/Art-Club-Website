import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

describe("gallery masonry layout", () => {
  it("uses two independent columns that collapse to one on mobile", () => {
    expect(css).toMatch(/\.gallery-columns\s*\{[^}]*display:\s*flex[^}]*align-items:\s*flex-start/);
    expect(css).toMatch(/\.gallery-column\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/@media \(max-width: 560px\)[\s\S]*\.gallery-columns\s*\{[^}]*display:\s*block/);
  });

  it("does not scale artwork previews on hover", () => {
    expect(css).not.toMatch(/\.artwork-button:hover \.artwork-preview\s*\{[^}]*transform:\s*scale/);
  });
});
