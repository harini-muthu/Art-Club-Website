# Balanced Gallery Masonry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render borderless, full-proportion gallery artwork in two independently balanced columns without grid gaps.

**Architecture:** Replace the single mapped gallery list with two column arrays computed by a shortest-column assignment helper. Render plain image buttons in two vertical column containers; CSS controls the desktop two-column wrapper and single mobile column.

**Tech Stack:** React, Next.js Image, TypeScript, CSS, Vitest, Testing Library.

## Global Constraints

- No preview card, border, background, fixed aspect-ratio frame, or crop.
- Desktop has two independent columns; each new image uses the shorter column.
- Mobile has one column.
- The existing lightbox remains unchanged.

---

### Task 1: Render balanced, borderless artwork columns

**Files:**
- Modify: `components/gallery-grid.tsx`
- Modify: `app/globals.css`
- Modify: `__tests__/gallery-lightbox.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
expect(screen.getAllByTestId("gallery-column")).toHaveLength(2);
expect(within(screen.getAllByTestId("gallery-column")[0]).getByRole("button", { name: "Open First" })).toBeVisible();
expect(within(screen.getAllByTestId("gallery-column")[1]).getByRole("button", { name: "Open Second" })).toBeVisible();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --run __tests__/gallery-lightbox.test.tsx`

Expected: FAIL because the component has one multi-column container.

- [ ] **Step 3: Implement shortest-column assignment and plain image previews**

Add a pure helper that assigns photos to one of two arrays by current accumulated `aspectRatio` height estimate. Render a `.gallery-columns` wrapper containing two `.gallery-column` containers. Replace framed preview markup with a direct responsive image button using natural height and no crop.

- [ ] **Step 4: Implement CSS**

Use a two-column flex/grid wrapper with a consistent gap, `align-items: flex-start`, and vertical column gaps. Remove gallery-card/frame styles from preview use. At the mobile breakpoint, render one column and move all photos into it through the responsive assignment hook.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- --run && npm run lint && npx tsc --noEmit && git diff --check`

Run: `git add components/gallery-grid.tsx app/globals.css __tests__/gallery-lightbox.test.tsx && git commit -m "feat: balance gallery masonry columns"`
