import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const temporaryDirectories: string[] = [];

function makeTemporaryDirectory() {
  const directory = mkdtempSync(join(tmpdir(), "supabase-keepalive-"));
  temporaryDirectories.push(directory);
  return directory;
}

function runKeepAlive(curlExitCode = 0) {
  const directory = makeTemporaryDirectory();
  const argumentsFile = join(directory, "curl-arguments.txt");
  const curlPath = join(directory, "curl");
  writeFileSync(
    curlPath,
    `#!/usr/bin/env sh\nprintf '%s\\n' "$@" > "$KEEP_ALIVE_CURL_ARGUMENTS"\nexit ${curlExitCode}\n`
  );
  chmodSync(curlPath, 0o755);

  const result = spawnSync("bash", ["scripts/supabase-keepalive.sh"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-test-key",
      KEEP_ALIVE_CURL_ARGUMENTS: argumentsFile,
      PATH: `${directory}:${process.env.PATH}`
    }
  });

  return { result, curlArguments: readFileSync(argumentsFile, "utf8") };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

describe("Supabase keep-alive", () => {
  it("performs a bounded read using the publishable key", () => {
    const { result, curlArguments } = runKeepAlive();

    expect(result.status).toBe(0);
    expect(curlArguments).toContain("--fail");
    expect(curlArguments).toContain("--output");
    expect(curlArguments).toContain("/dev/null");
    expect(curlArguments).toContain("apikey: publishable-test-key");
    expect(curlArguments).toContain("select=id");
    expect(curlArguments).toContain("limit=1");
    expect(curlArguments).toContain("https://example.supabase.co/rest/v1/members");
  });

  it("fails when Supabase returns an error", () => {
    const { result } = runKeepAlive(22);

    expect(result.status).toBe(22);
  });

  it("configures the workflow for daily and manual runs with repository secrets", () => {
    const workflow = readFileSync(
      join(process.cwd(), ".github/workflows/supabase-keepalive.yml"),
      "utf8"
    );

    expect(workflow).toContain("schedule:");
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}");
    expect(workflow).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}");
    expect(workflow).toContain("bash scripts/supabase-keepalive.sh");
  });
});
