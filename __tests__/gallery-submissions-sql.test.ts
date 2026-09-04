import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(join(process.cwd(), "supabase/sql/2026-08-07-gallery-submissions.sql"), "utf8");

describe("gallery submissions SQL", () => {
  it("creates the submission record with officer review states", () => {
    expect(sql).toContain("create table if not exists gallery_submissions");
    expect(sql).toContain("review_status text not null default 'pending'");
    expect(sql).toContain("check (review_status in ('pending', 'approved', 'rejected', 'changes_needed'))");
    expect(sql).toContain("member_id uuid not null references members(id)");
  });

  it("keeps submitted originals private and approved images public", () => {
    expect(sql).toContain("'gallery-submissions'");
    expect(sql).toContain("'gallery-images'");
    expect(sql).toContain("false,");
    expect(sql).toContain("true,");
  });

  it("limits review and pending storage access to current officers", () => {
    expect(sql).toContain("using (is_current_officer())");
    expect(sql).toContain('"Officers can read gallery submissions"');
    expect(sql).toContain('"Officers can manage private gallery submissions"');
  });
});
