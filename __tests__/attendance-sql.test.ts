import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migrationSql = readFileSync(
  join(process.cwd(), "supabase/sql/2026-07-20-qr-attendance.sql"),
  "utf8"
);

const eventWindowSql = readFileSync(
  join(process.cwd(), "supabase/sql/2026-07-28-event-window-attendance.sql"),
  "utf8"
);

describe("QR attendance SQL", () => {
  it("uses Eastern event windows and returns all active activities", () => {
    expect(eventWindowSql).toContain("America/New_York");
    expect(eventWindowSql).toContain("coalesce(meetings.starts_at, time '00:00')");
    expect(eventWindowSql).toContain("coalesce(meetings.ends_at, time '24:00')");
    expect(eventWindowSql).toContain("returns table (");
    expect(eventWindowSql).toContain("where meetings.meeting_date = site_today");
  });

  it("maintains saved activity totals only for newly qualifying attendance", () => {
    expect(eventWindowSql).toContain("attendance_count integer not null default 0");
    expect(eventWindowSql).toContain("counts_toward_event_total boolean not null default false");
    expect(eventWindowSql).toContain("alter column counts_toward_event_total set default true");
    expect(eventWindowSql).toContain("attendance_records_adjust_meeting_total");
    expect(eventWindowSql).toContain("greatest(attendance_count - 1, 0)");
  });

  it("validates the selected active event before recording attendance", () => {
    expect(eventWindowSql).toContain("meeting_id_input uuid");
    expect(eventWindowSql).toContain("meetings.id = meeting_id_input");
    expect(eventWindowSql).toContain("and (site_now::time < coalesce(meetings.ends_at, time '24:00'))");
  });

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
