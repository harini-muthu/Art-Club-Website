# Event Image Uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let officers upload JPG/PNG files for event images through the admin activity forms and display those images on the public Events page.

**Architecture:** Add a focused upload helper around Supabase Storage, keep `meetings.image_url` as the public rendering field, and update admin server actions to upload, replace, remove, and clean up files. Supabase SQL creates a public-read `event-images` bucket with officer-only write/delete policies.

**Tech Stack:** Next.js App Router server actions, TypeScript, Supabase SSR client, Supabase Storage, Vitest.

---

## File Map

- Modify `lib/admin-entry-validation.ts`: validate optional `eventImage` file, preserve existing image URL, and support image removal.
- Create `lib/event-image-storage.ts`: storage bucket constants, file-name helpers, public URL/path extraction, upload/delete helpers.
- Modify `app/admin/actions.ts`: call upload/delete helpers in add/update/delete meeting actions.
- Modify `components/admin-entry-forms.tsx`: replace Image URL with file input on Add Activity.
- Modify `app/admin/page.tsx`: replace edit Image URL with current-image hidden field, file input, and remove checkbox.
- Modify `types/supabase-ssr.d.ts`: add minimal Supabase Storage types used by app code.
- Modify tests in `__tests__/admin-entry-validation.test.ts` and `__tests__/admin-actions.test.ts`.
- Create `supabase/sql/2026-07-17-event-image-storage.sql`.
- Modify `GITHUB_UPLOAD_CHECKLIST.md` and refresh `github-upload-ready/`.

## Task 1: Event Image Validation

**Files:**
- Modify: `lib/admin-entry-validation.ts`
- Test: `__tests__/admin-entry-validation.test.ts`

- [ ] Write failing tests for valid JPG files, invalid GIF files, oversized files, preserving existing image URL, and remove-image behavior.
- [ ] Run `npm test -- __tests__/admin-entry-validation.test.ts` and verify the new tests fail because file validation is not implemented.
- [ ] Implement `validateOptionalEventImageFile`, `EventImageFile`, `currentImageUrl`, and `removeImage`.
- [ ] Run `npm test -- __tests__/admin-entry-validation.test.ts` and verify it passes.

## Task 2: Storage Helper

**Files:**
- Create: `lib/event-image-storage.ts`
- Test: `__tests__/event-image-storage.test.ts`

- [ ] Write failing tests for safe file names, bucket public URL detection, external URL rejection for cleanup, upload success, upload failure, and remove success.
- [ ] Run `npm test -- __tests__/event-image-storage.test.ts` and verify the tests fail because the helper does not exist.
- [ ] Implement storage helper functions against `supabase.storage.from(EVENT_IMAGE_BUCKET)`.
- [ ] Run `npm test -- __tests__/event-image-storage.test.ts` and verify it passes.

## Task 3: Server Actions

**Files:**
- Modify: `app/admin/actions.ts`
- Test: `__tests__/admin-actions.test.ts`

- [ ] Write failing tests that Add Activity uploads an image before insert, Edit Activity replaces an existing image, Edit Activity removes an existing image, and Delete Activity removes a stored image.
- [ ] Run `npm test -- __tests__/admin-actions.test.ts` and verify the new tests fail.
- [ ] Implement upload, replace, remove, and delete cleanup in meeting server actions.
- [ ] Run `npm test -- __tests__/admin-actions.test.ts` and verify it passes.

## Task 4: Admin Forms

**Files:**
- Modify: `components/admin-entry-forms.tsx`
- Modify: `app/admin/page.tsx`

- [ ] Change Add Activity to `encType="multipart/form-data"` with `eventImage` file input.
- [ ] Change Edit Activity to include `currentImageUrl`, `eventImage`, and `removeImage` controls.
- [ ] Keep `imageAlt` as the image description field.

## Task 5: Supabase SQL and Upload Bundle

**Files:**
- Create: `supabase/sql/2026-07-17-event-image-storage.sql`
- Modify: `GITHUB_UPLOAD_CHECKLIST.md`
- Refresh: `github-upload-ready/`

- [ ] Add SQL to create the `event-images` bucket.
- [ ] Add public read policies and officer-only write/delete storage policies.
- [ ] Update the checklist with the new helper, test, plan/spec, and SQL files.
- [ ] Refresh `github-upload-ready/` with all repo-ready files.

## Task 6: Full Verification

- [ ] Run `npm test`.
- [ ] Run `npm run lint`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.

