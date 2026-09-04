# Gallery Masonry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display every gallery image in full at a moderate size within a responsive three-column masonry flow.

**Architecture:** Keep the existing CSS multi-column layout and change thumbnail rendering from crop-to-fill to natural image sizing. The CSS column count sets three desktop columns, drops to two at the existing medium breakpoint, then one on mobile. Cards remain unbreakable column items.

**Tech Stack:** Next.js Image, React, CSS columns, Vitest, Testing Library.

## Global Constraints

- No gallery thumbnail may crop a submitted artwork.
- Cards preserve source proportions and vary in height naturally.
- Gallery uses three columns on desktop, two at the medium breakpoint, and one on small screens.
- Cards do not split across columns and retain the existing 18px gap.
- The lightbox remains unchanged and continues to show the whole image.

---

### Task 1: Preserve full artwork in responsive masonry columns

**Files:**
- Modify: `components/gallery-grid.tsx:33-40`
- Modify: `app/globals.css:320-324, 1397-1460`
- Modify: `__tests__/gallery-lightbox.test.tsx:18-34`
- Create: `__tests__/gallery-masonry-css.test.ts`

**Interfaces:**
- Consumes: `GalleryPhoto.imageUrl` and `GalleryPhoto.aspectRatio`.
- Produces: full-image gallery previews in CSS masonry columns without modifying lightbox behavior.

- [ ] **Step 1: Write failing tests**

```tsx
expect(artworkButtons[0].querySelector("img")).toHaveStyle({ objectFit: "contain" });
```

```ts
expect(css).toMatch(/\.gallery-grid\s*\{[^}]*column-count:\s*3/);
expect(css).toMatch(/@media \(max-width: 880px\)[\s\S]*\.gallery-grid\s*\{[^}]*column-count:\s*2/);
expect(css).toMatch(/@media \(max-width: 560px\)[\s\S]*\.gallery-grid\s*\{[^}]*column-count:\s*1/);
```

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- --run __tests__/gallery-lightbox.test.tsx __tests__/gallery-masonry-css.test.ts`

Expected: FAIL because thumbnail images use `objectFit: "cover"` and desktop has two columns with no medium two-column rule.

- [ ] **Step 3: Write minimal implementation**

Change only gallery preview images to `objectFit: "contain"`, retain their `aspectRatio`, and use a neutral preview background. Update the masonry CSS:

```css
.gallery-grid { column-count: 3; column-gap: 18px; }
@media (max-width: 880px) { .gallery-grid { column-count: 2; } }
@media (max-width: 560px) { .gallery-grid { column-count: 1; } }
```

Retain `.gallery-card { break-inside: avoid; margin: 0 0 18px; }`.

- [ ] **Step 4: Run focused and full verification**

Run: `npm test -- --run __tests__/gallery-lightbox.test.tsx __tests__/gallery-masonry-css.test.ts && npm test -- --run && npm run lint && npx tsc --noEmit && git diff --check`

Expected: all checks pass.

- [ ] **Step 5: Commit**

Run: `git add components/gallery-grid.tsx app/globals.css __tests__/gallery-lightbox.test.tsx __tests__/gallery-masonry-css.test.ts && git commit -m "feat: show full gallery artwork in masonry layout"`
