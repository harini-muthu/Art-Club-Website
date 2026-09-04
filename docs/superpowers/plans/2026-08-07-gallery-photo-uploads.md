# Member Gallery Photo Uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let active members submit artwork photos for officer review, with only approved work shown publicly.

**Architecture:** A public server action validates the submitted email against an active membership and writes the original to private Supabase Storage. Officers review the record in the existing dashboard; approval copies the original to a public gallery bucket and updates the record used by the public Gallery query.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase Postgres/Storage/RLS, Vitest.

## Global Constraints

- Accept one JPG or PNG image, at most 5 MiB, per submission.
- Use the verified member record's full name as public artist credit.
- Keep pending artwork private; only officer-approved work may have a public image URL.
- Show a receipt after submission and do not introduce outbound email.
- A membership-email match is the selected, non-authenticated identity check.

---

### Task 1: Gallery submission domain and tests

**Files:**
- Create: `lib/gallery-submissions.ts`
- Create: `lib/gallery-image-storage.ts`
- Test: `__tests__/gallery-submissions.test.ts`
- Test: `__tests__/gallery-image-storage.test.ts`

- [ ] Write failing tests for normalized member email, required metadata/consent, image type/size validation, public-gallery mapping, private upload, publish cleanup, and deletion.
- [ ] Implement the small validation, mapping, and storage helpers until the tests pass.

### Task 2: Supabase schema and policies

**Files:**
- Create: `supabase/sql/2026-08-07-gallery-submissions.sql`
- Test: `__tests__/gallery-submissions-sql.test.ts`

- [ ] Write failing SQL-content tests for the table, two buckets, and officer-only object/table policies.
- [ ] Add the migration with the review statuses, private original storage, public approved-image storage, and officer authorization policies.

### Task 3: Member submission experience

**Files:**
- Create: `app/gallery/submit/page.tsx`
- Create: `app/gallery/submit/actions.ts`
- Create: `components/gallery-submission-form.tsx`
- Modify: `app/gallery/page.tsx`
- Modify: `app/globals.css`
- Test: `__tests__/gallery-submission-action.test.ts`

- [ ] Write failing server-action tests for active-membership lookup, private upload, record creation, generic failures, and success redirect.
- [ ] Implement the server action and form; add the Gallery entry point and accessible submission/receipt states.

### Task 4: Officer review and public gallery data

**Files:**
- Create: `app/admin/(dashboard)/gallery/page.tsx`
- Create: `components/gallery-submissions-table.tsx`
- Modify: `app/admin/actions.ts`
- Modify: `components/admin-navigation.tsx`
- Modify: `app/gallery/page.tsx`
- Test: `__tests__/gallery-review-actions.test.ts`
- Test: `__tests__/gallery-page-data.test.ts`

- [ ] Write failing tests for officer-only review transitions, publish failure recovery, and approved-only gallery reads.
- [ ] Implement review actions/table/navigation and load real approved artwork, retaining sample data only without Supabase configuration.

### Task 5: Full verification

**Files:**
- Modify: only files required by test/type/lint fixes.

- [ ] Run focused gallery tests, then the full test suite, lint, and production build.
- [ ] Review the final diff against this plan and confirm no pending images can be publicly queried.
