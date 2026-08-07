# Gallery Review States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate submissions awaiting review from published artwork, make approved rows delete-only, and allow blank dimensions and statements.

**Architecture:** Filter one dashboard submission list into review and published sections. Validation retains empty optional values; table rows omit absent details. Existing redirect statuses drive success receipts.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase, Vitest, Testing Library.

## Global Constraints

- Approved artwork stays public until Delete removes image files and its record.
- Published rows show thumbnail, title, artist, published status, and Delete only.
- Delete copy is exactly `Are you sure you want to delete this artwork?`.
- Dimensions and artist statement are optional.
- Success copy is exactly `Artwork approved and published.` and `Artwork deleted.`.

---

### Task 1: Accept optional member artwork details

**Files:**
- Modify: `lib/gallery-submissions.ts:43-75`
- Modify: `components/gallery-submission-form.tsx:13-16`
- Test: `__tests__/gallery-submissions.test.ts`

**Interfaces:** Produces valid `GallerySubmission` values with empty `dimensions` and `statement` when omitted.

- [ ] **Step 1: Write the failing test**

```ts
it("accepts an artwork submission without dimensions or a statement", () => expect(validateGallerySubmission(formData({ schoolEmail: "member@school.edu", title: "Piece", classYear: "2027", medium: "Ink", dimensions: "", statement: "", image: new File(["x"], "piece.jpg", { type: "image/jpeg" }), consent: "on" }))).toMatchObject({ ok: true }));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run __tests__/gallery-submissions.test.ts`

Expected: FAIL because dimensions and statement are required.

- [ ] **Step 3: Write minimal implementation**

Remove the two required-field checks in `validateGallerySubmission`, retaining their trimmed strings. Remove `required` from the dimensions and statement controls and label each `(optional)`.

```tsx
<label>Dimensions (optional)<input name="dimensions" placeholder="24 x 30 in." type="text" /></label>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run __tests__/gallery-submissions.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add lib/gallery-submissions.ts components/gallery-submission-form.tsx __tests__/gallery-submissions.test.ts && git commit -m "feat: make gallery details optional"`

### Task 2: Render review and published artwork tables

**Files:**
- Modify: `components/gallery-submissions-table.tsx:5-21`
- Test: `__tests__/gallery-submissions-table.test.tsx`

**Interfaces:** Consumes `Array<AdminGallerySubmission & { reviewImageUrl: string | null }>` and produces `Needs review` and `Published artwork` sections.

- [ ] **Step 1: Write failing component tests**

```tsx
it("renders approved artwork only in the compact published section", () => { render(<GallerySubmissionsTable submissions={[pendingSubmission, approvedSubmission]} {...actions} />); expect(screen.getByRole("heading", { name: "Published artwork" })).toBeInTheDocument(); expect(screen.getAllByRole("button", { name: "Approve" })).toHaveLength(1); expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2); });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run __tests__/gallery-submissions-table.test.tsx`

Expected: FAIL because the current component has one list and shows approval controls for every row.

- [ ] **Step 3: Write minimal implementation**

Derive `published` with `review_status === "approved"`; place all other statuses in `needsReview`. Render detailed rows only for `needsReview`. Render compact published rows with image, title, artist, `Status: approved`, and Delete only. Wrap dimension and statement paragraphs in truthy checks.

```tsx
<ConfirmSubmitButton className="button danger" message="Are you sure you want to delete this artwork?">Delete</ConfirmSubmitButton>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- --run __tests__/gallery-submissions-table.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

Run: `git add components/gallery-submissions-table.tsx __tests__/gallery-submissions-table.test.tsx && git commit -m "feat: separate gallery review and published artwork"`

### Task 3: Display review-action receipts

**Files:**
- Modify: `app/admin/(dashboard)/gallery/page.tsx:5-8`
- Test: `__tests__/gallery-submissions-table.test.tsx`

**Interfaces:** Consumes `searchParams: Promise<{ status?: string }>` and produces `role="status"` receipts for approval and deletion.

- [ ] **Step 1: Write failing page tests**

```tsx
expect(screen.getByRole("status")).toHaveTextContent("Artwork approved and published.");
```

Render the page with `status: "gallery-reviewed"` and separately with `status: "gallery-deleted"`, asserting `Artwork deleted.` in the second test.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run __tests__/gallery-submissions-table.test.tsx`

Expected: FAIL because the page currently ignores query status.

- [ ] **Step 3: Write minimal implementation**

Await `searchParams`, map `gallery-reviewed` to `Artwork approved and published.` and `gallery-deleted` to `Artwork deleted.`, then render a `<p role="status" className="form-success">` before the tables when a message exists.

- [ ] **Step 4: Run full verification**

Run: `npm test -- --run && npm run lint && npx tsc --noEmit && git diff --check`

Expected: all checks pass.

- [ ] **Step 5: Commit**

Run: `git add app/admin/'(dashboard)'/gallery/page.tsx __tests__/gallery-submissions-table.test.tsx && git commit -m "feat: confirm gallery review actions"`
