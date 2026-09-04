# Gallery Masonry Design

## Goal

Show every submitted artwork in full on the public gallery page while arranging the cards in a compact, visually flowing masonry layout.

## Image presentation

Gallery thumbnails use their source image proportions. They no longer use a crop-to-fill rule, so no part of a submitted artwork is hidden. Each image scales down to the width of its masonry column; card height varies naturally by artwork.

The existing lightbox continues to use `object-fit: contain`, which already shows the complete image at a larger size.

## Layout

Use CSS multi-column masonry rather than a JavaScript layout library. The gallery shows three moderate-width columns on desktop, two columns on medium screens, and one column on small screens. Cards avoid breaking between columns and maintain a consistent vertical gap.

The gallery container remains constrained by the site’s existing content width so images do not become oversized on wide displays.

## Tests

- Gallery preview images use non-cropping display behavior.
- The gallery has the masonry class and preserves submission order in its markup.
- CSS defines the three-, two-, and one-column responsive layout and prevents cards from splitting across columns.
