"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import type { GalleryPhoto } from "@/lib/site-data";

type GalleryGridProps = {
  photos: GalleryPhoto[];
};

function estimatedHeight(aspectRatio: string) {
  const [width, height] = aspectRatio.split("/").map((value) => Number(value.trim()));

  return width > 0 && height > 0 ? height / width : 1;
}

function photoImageKey(photo: GalleryPhoto) {
  return `${photo.id}:${photo.imageUrl ?? "fallback"}`;
}

function assignPhotosToColumnsUsingMeasurements(
  photos: GalleryPhoto[],
  measuredHeights: Readonly<Record<string, number>>
) {
  const columns: [GalleryPhoto[], GalleryPhoto[]] = [[], []];
  const heights = [0, 0];

  photos.forEach((photo) => {
    const columnIndex = heights[0] <= heights[1] ? 0 : 1;
    columns[columnIndex].push(photo);
    heights[columnIndex] += measuredHeights[photoImageKey(photo)] ?? estimatedHeight(photo.aspectRatio);
  });

  return columns;
}

export function assignPhotosToColumns(photos: GalleryPhoto[]) {
  return assignPhotosToColumnsUsingMeasurements(photos, {});
}

function useSingleGalleryColumn() {
  const [isSingleColumn, setIsSingleColumn] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 560px)");
    const updateColumns = () => setIsSingleColumn(mediaQuery.matches);

    updateColumns();
    mediaQuery.addEventListener("change", updateColumns);
    return () => mediaQuery.removeEventListener("change", updateColumns);
  }, []);

  return isSingleColumn;
}

export function GalleryGrid({ photos }: GalleryGridProps) {
  const [selectedArtwork, setSelectedArtwork] = useState<GalleryPhoto | null>(null);
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});
  const isSingleColumn = useSingleGalleryColumn();
  const columns = isSingleColumn
    ? [photos]
    : assignPhotosToColumnsUsingMeasurements(photos, measuredHeights);

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
      <div className="gallery-columns">
        {columns.map((column, columnIndex) => (
          <div className="gallery-column" data-testid="gallery-column" key={columnIndex}>
            {column.map((photo) => (
              <button
                aria-label={`Open ${photo.title}`}
                className="artwork-button"
                key={photo.id}
                onClick={() => setSelectedArtwork(photo)}
                type="button"
              >
                {photo.imageUrl ? (
                  <Image
                    alt={`${photo.title} by ${photo.artist}`}
                    height={1200 * estimatedHeight(photo.aspectRatio)}
                    onLoad={(event) => {
                      const { naturalHeight, naturalWidth } = event.currentTarget;

                      if (naturalHeight <= 0 || naturalWidth <= 0) {
                        return;
                      }

                      const imageKey = photoImageKey(photo);
                      const measuredHeight = naturalHeight / naturalWidth;
                      setMeasuredHeights((currentHeights) => currentHeights[imageKey] === measuredHeight
                        ? currentHeights
                        : { ...currentHeights, [imageKey]: measuredHeight }
                      );
                    }}
                    sizes="(max-width: 560px) 100vw, 50vw"
                    src={photo.imageUrl}
                    style={{ display: "block", height: "auto", width: "100%" }}
                    unoptimized
                    width={1200}
                  />
                ) : (
                  <span
                    className={`artwork-fallback tone-${photo.color}`}
                    style={{ aspectRatio: photo.aspectRatio }}
                  >
                    {photo.title}
                  </span>
                )}
              </button>
            ))}
          </div>
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
              {selectedArtwork.imageUrl ? <Image alt={`${selectedArtwork.title} by ${selectedArtwork.artist}`} fill sizes="90vw" src={selectedArtwork.imageUrl} style={{ objectFit: "contain" }} unoptimized /> : <span>{selectedArtwork.title}</span>}
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
                {selectedArtwork.dimensions ? <div>
                  <dt>Size</dt>
                  <dd>{selectedArtwork.dimensions}</dd>
                </div> : null}
              </dl>
              {selectedArtwork.statement ? <p>{selectedArtwork.statement}</p> : null}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
