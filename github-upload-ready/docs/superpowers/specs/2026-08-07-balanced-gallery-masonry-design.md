# Balanced Gallery Masonry Design

## Goal

Replace framed gallery previews with a balanced, borderless two-column masonry display that always shows complete artwork.

## Image presentation

Gallery items render as the image itself: no card border, gray background, fixed aspect-ratio frame, or crop. Each image uses its natural height at the width of its assigned column. The existing artwork dialog remains available when an image is selected.

## Layout

The gallery uses two independent columns on desktop. Images are assigned to the currently shorter column so the visible layout remains balanced and does not create grid-row gaps. A single-column layout is used on mobile.

The columns and images use a consistent gap. The layout does not use CSS grid rows or the browser multi-column flow because neither gives the required balanced placement.

## Tests

- Images render without a preview frame and use natural image sizing.
- With two artworks, each image is placed in a separate desktop column.
- New artwork is assigned to the currently shorter column.
- Mobile uses one column and the lightbox behavior remains unchanged.
