import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const nextConfig = readFileSync(join(process.cwd(), "next.config.mjs"), "utf8");

describe("gallery upload configuration", () => {
  it("allows the gallery form to send the advertised 5 MB image limit to its server action", () => {
    expect(nextConfig).toContain("serverActions");
    expect(nextConfig).toContain("bodySizeLimit: \"5mb\"");
  });
});
