# GitHub Upload Checklist

Use this as the source of truth for what belongs in the GitHub repo. Upload
these files and folders while preserving the same folder structure.

## Upload These Root Files

- `.env.example`
- `.gitignore`
- `.npmrc`
- `GITHUB_UPLOAD_CHECKLIST.md`
- `README.md`
- `eslint.config.mjs`
- `next-env.d.ts`
- `next.config.mjs`
- `package.json`
- `tsconfig.json`
- `vitest.config.ts`
- `vitest.setup.ts`

## Upload These App Files

- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/about/page.tsx`
- `app/admin/actions.ts`
- `app/admin/page.tsx`
- `app/admin/login/login-form.tsx`
- `app/admin/login/page.tsx`
- `app/api/contact/route.ts`
- `app/contact/page.tsx`
- `app/gallery/page.tsx`

## Upload These Component Files

- `components/admin-entry-forms.tsx`
- `components/confirm-submit-button.tsx`
- `components/contact-form.tsx`
- `components/gallery-grid.tsx`
- `components/page-section.tsx`
- `components/site-header.tsx`

## Upload These Library Files

- `lib/admin-auth.ts`
- `lib/admin-data.ts`
- `lib/admin-entry-validation.ts`
- `lib/contact-validation.ts`
- `lib/event-display.ts`
- `lib/site-data.ts`
- `lib/supabase/client.ts`
- `lib/supabase/config.ts`
- `lib/supabase/server.ts`

## Upload These Test Files

- `__tests__/about-page.test.tsx`
- `__tests__/admin-actions.test.ts`
- `__tests__/admin-auth.test.ts`
- `__tests__/admin-data.test.ts`
- `__tests__/admin-entry-validation.test.ts`
- `__tests__/admin-login-form.test.tsx`
- `__tests__/contact-form.test.tsx`
- `__tests__/contact-route.test.ts`
- `__tests__/contact-validation.test.ts`
- `__tests__/event-display.test.ts`
- `__tests__/gallery-lightbox.test.tsx`
- `__tests__/navigation.test.tsx`
- `__tests__/site-content.test.ts`
- `__tests__/supabase-client.test.ts`
- `__tests__/supabase-config.test.ts`

## Upload These Type/Test Stub Files

- `test-stubs/supabase-ssr.ts`
- `types/supabase-ssr.d.ts`

## Upload These Supabase SQL Files

- `supabase/sql/2026-07-17-event-images-public-calendar.sql`
- `supabase/sql/2026-07-17-admin-edit-delete-policies.sql`

## Do Not Upload These

These are local, generated, private, or too large for GitHub:

- `.DS_Store`
- `.env.local`
- `.env*.local`
- `.git/`
- `.next/`
- `.npm-cache/`
- `.superpowers/`
- `node_modules/`
- `out/`
- `coverage/`
- `tsconfig.tsbuildinfo`

## Notes

- Keep `.env.example` in GitHub because it shows which environment variables
  are needed without exposing real secrets.
- Keep `.env.local` out of GitHub because it can contain real Supabase or email
  credentials.
- If `package-lock.json` is generated later, add it only if the project is
  consistently using npm lockfiles again.
- After uploading, Vercel should redeploy from the GitHub branch connected to
  the project.
