import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const nextConfig = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");

describe("gallery upload configuration", () => {
  it("limits the gallery form to a 1 MB image upload", () => {
    expect(nextConfig).toContain("serverActions");
    expect(nextConfig).toContain("bodySizeLimit: \"1mb\"");
  });
});
