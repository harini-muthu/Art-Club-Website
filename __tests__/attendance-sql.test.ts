import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(process.cwd(), "supabase/sql/2026-07-20-qr-attendance.sql"),
  "utf8"
);

describe("QR attendance SQL", () => {
  it("matches submitted attendance names to members without case sensitivity", () => {
    expect(migrationSql).toContain(
      String.raw`normalized_name := lower(regexp_replace(display_name, '\s+', ' ', 'g'));`
    );
    expect(
      migrationSql.match(
        /lower\(regexp_replace\(btrim\(members\.full_name\), '\\s\+', ' ', 'g'\)\)\s*=\s*normalized_name/g
      )
    ).toHaveLength(2);
  });

  it("deduplicates visitor names without case sensitivity", () => {
    expect(migrationSql).toContain(
      String.raw`lower(regexp_replace(btrim(attendee_name), '\s+', ' ', 'g'))`
    );
    expect(migrationSql).toContain(
      String.raw`regexp_replace(btrim(attendance_records.attendee_name), '\s+', ' ', 'g')`
    );
  });
});
