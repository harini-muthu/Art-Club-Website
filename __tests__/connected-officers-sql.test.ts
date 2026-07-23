import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(process.cwd(), "supabase/sql/2026-07-21-connected-officers.sql"),
  "utf8"
);

describe("connected officers SQL", () => {
  it("creates a public officer view without private email", () => {
    expect(migrationSql).toContain("create or replace view public_officers as");
    expect(migrationSql).toContain("select id, name, role, focus");
    expect(migrationSql).not.toContain("select id, name, role, email, focus");
  });

  it("uses officer email as the access source instead of officer profiles", () => {
    expect(migrationSql).toContain("where officers.email = lower(auth.email())");
    expect(migrationSql).toContain("using (is_current_officer())");
    expect(migrationSql).not.toContain("where officer_profiles.auth_user_id = auth.uid()");
  });
});
