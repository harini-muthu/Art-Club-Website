"use client";

import React, { useEffect, useState } from "react";
import type { GalleryPhoto } from "@/lib/site-data";

type GalleryGridProps = {
  photos: GalleryPhoto[];
};

export function GalleryGrid({ photos }: GalleryGridProps) {
  const [selectedArtwork, setSelectedArtwork] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    if (!selectedArtwork) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedArtwork(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedArtwork]);

  return (
    <>
      <div className="gallery-grid masonry-flow">
        {photos.map((photo) => (
          <article className="gallery-card" key={photo.id}>
            <button
              aria-label={`Open ${photo.title}`}
              className="artwork-button"
              onClick={() => setSelectedArtwork(photo)}
              type="button"
            >
              <div
                className={`photo-placeholder artwork-preview tone-${photo.color}`}
                style={{ aspectRatio: photo.aspectRatio }}
              >
                <span>{photo.title}</span>
              </div>
            </button>
          </article>
        ))}
      </div>

      {selectedArtwork ? (
        <div
          aria-label={`${selectedArtwork.title} artwork details`}
          aria-modal="true"
          className="lightbox-backdrop"
          role="dialog"
        >
          <button
            aria-label="Dismiss artwork details"
            className="lightbox-scrim"
            onClick={() => setSelectedArtwork(null)}
            type="button"
          />
          <section className="lightbox-panel">
            <button
              aria-label="Close artwork details"
              className="lightbox-close"
              onClick={() => setSelectedArtwork(null)}
              type="button"
            >
              Close
            </button>
            <div
              className={`lightbox-art tone-${selectedArtwork.color}`}
              style={{ aspectRatio: selectedArtwork.aspectRatio }}
            >
              <span>{selectedArtwork.title}</span>
            </div>
            <div className="lightbox-details">
              <p className="eyebrow">Member submission</p>
              <h2>{selectedArtwork.title}</h2>
              <dl>
                <div>
                  <dt>Artist</dt>
                  <dd>{selectedArtwork.artist}</dd>
                </div>
                <div>
                  <dt>Year</dt>
                  <dd>{selectedArtwork.year}</dd>
                </div>
                <div>
                  <dt>Medium</dt>
                  <dd>{selectedArtwork.medium}</dd>
                </div>
                <div>
                  <dt>Size</dt>
                  <dd>{selectedArtwork.dimensions}</dd>
                </div>
              </dl>
              <p>{selectedArtwork.statement}</p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
