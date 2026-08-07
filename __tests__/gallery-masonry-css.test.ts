import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");

describe("gallery masonry layout", () => {
  it("uses responsive three-to-one masonry columns", () => {
    expect(css).toMatch(/\.gallery-grid\s*\{[^}]*column-count:\s*3/);
    expect(css).toMatch(/@media \(max-width: 880px\)[\s\S]*\.gallery-grid\s*\{[^}]*column-count:\s*2/);
    expect(css).toMatch(/@media \(max-width: 560px\)[\s\S]*\.gallery-grid\s*\{[^}]*column-count:\s*1/);
  });

  it("does not scale artwork previews on hover", () => {
    expect(css).not.toMatch(/\.artwork-button:hover \.artwork-preview\s*\{[^}]*transform:\s*scale/);
  });
});
