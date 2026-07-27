# GitHub Upload Checklist

`github-upload-ready/` is a complete upload-ready copy of this project.
Upload its **contents** to the root of the GitHub repository; do not upload
the `github-upload-ready` folder as a nested directory.

## Required admin split files

The following paths must be present in GitHub for the new admin navigation:

- `app/admin/page.tsx`
- `app/admin/(dashboard)/layout.tsx`
- `app/admin/(dashboard)/memberships/page.tsx`
- `app/admin/(dashboard)/activities/page.tsx`
- `app/admin/(dashboard)/officers/page.tsx`
- `components/admin-navigation.tsx`
- `components/admin-dashboard-notice.tsx`
- `lib/admin-dashboard.ts`
- `lib/admin-dashboard-messages.ts`

The updated versions of `app/admin/actions.ts`,
`components/admin-entry-forms.tsx`, `app/globals.css`, and the test files
must also be uploaded.

## Important replacement

Replace the old `app/admin/page.tsx` in GitHub with the version in this upload
package. It now contains the condensed overview and navigation links to every
admin section.

## Do not upload

- `.env.local` or any `.env*.local` file
- `.git/`
- `.next/`, `node_modules/`, `out/`, `coverage/`, or `.npm-cache/`
- `.superpowers/`, `.DS_Store`, or `tsconfig.tsbuildinfo`
