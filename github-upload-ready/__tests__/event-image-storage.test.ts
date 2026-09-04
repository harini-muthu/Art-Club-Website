import { describe, expect, it, vi } from "vitest";
import {
  buildEventImagePath,
  deleteEventImage,
  EVENT_IMAGE_BUCKET,
  getEventImagePathFromPublicUrl,
  uploadEventImage
} from "@/lib/event-image-storage";

function createStorageClient(options?: {
  publicUrl?: string;
  uploadError?: { message: string } | null;
  removeError?: { message: string } | null;
}) {
  const upload = vi.fn(async () => ({
    data: { path: "events/meeting-1/upload-1-poster.jpg" },
    error: options?.uploadError ?? null
  }));
  const getPublicUrl = vi.fn(() => ({
    data: {
      publicUrl:
        options?.publicUrl ??
        "https://example.supabase.co/storage/v1/object/public/event-images/events/meeting-1/upload-1-poster.jpg"
    }
  }));
  const remove = vi.fn(async () => ({
    data: [],
    error: options?.removeError ?? null
  }));
  const from = vi.fn(() => ({ getPublicUrl, remove, upload }));

  return {
    client: { storage: { from } },
    from,
    getPublicUrl,
    remove,
    upload
  };
}

describe("event image storage", () => {
  it("builds a stable bucket path with a safe file name", () => {
    const file = new File(["image"], " Figure Night!!.JPG ", {
      type: "image/jpeg"
    });

    expect(buildEventImagePath("meeting-1", file, "upload-1")).toBe(
      "events/meeting-1/upload-1-figure-night.jpg"
    );
  });

  it("extracts only event-images bucket paths from Supabase public URLs", () => {
    expect(
      getEventImagePathFromPublicUrl(
        "https://example.supabase.co/storage/v1/object/public/event-images/events/meeting-1/poster.png",
        "https://example.supabase.co"
      )
    ).toBe("events/meeting-1/poster.png");

    expect(
      getEventImagePathFromPublicUrl(
        "https://cdn.example.edu/event-images/events/meeting-1/poster.png",
        "https://example.supabase.co"
      )
    ).toBeNull();
  });

  it("uploads an event image and returns its public URL", async () => {
    const { client, from, getPublicUrl, upload } = createStorageClient();
    const file = new File(["image"], "Poster.png", { type: "image/png" });

    await expect(
      uploadEventImage(client, file, {
        scopeId: "meeting-1",
        uploadId: "upload-1"
      })
    ).resolves.toEqual({
      ok: true,
      path: "events/meeting-1/upload-1-poster.png",
      publicUrl:
        "https://example.supabase.co/storage/v1/object/public/event-images/events/meeting-1/upload-1-poster.jpg"
    });

    expect(from).toHaveBeenCalledWith(EVENT_IMAGE_BUCKET);
    expect(upload).toHaveBeenCalledWith(
      "events/meeting-1/upload-1-poster.png",
      file,
      {
        contentType: "image/png",
        upsert: true
      }
    );
    expect(getPublicUrl).toHaveBeenCalledWith(
      "events/meeting-1/upload-1-poster.png"
    );
  });

  it("returns an error when upload fails", async () => {
    const { client } = createStorageClient({
      uploadError: { message: "bucket missing" }
    });

    await expect(
      uploadEventImage(
        client,
        new File(["image"], "poster.jpg", { type: "image/jpeg" }),
        { scopeId: "meeting-1", uploadId: "upload-1" }
      )
    ).resolves.toEqual({
      ok: false,
      error: "bucket missing"
    });
  });

  it("removes only images owned by the event-images bucket", async () => {
    const { client, remove } = createStorageClient();

    await expect(
      deleteEventImage(
        client,
        "https://example.supabase.co/storage/v1/object/public/event-images/events/meeting-1/poster.png",
        "https://example.supabase.co"
      )
    ).resolves.toEqual({ ok: true });
    expect(remove).toHaveBeenCalledWith(["events/meeting-1/poster.png"]);

    remove.mockClear();
    await expect(
      deleteEventImage(
        client,
        "https://cdn.example.edu/poster.png",
        "https://example.supabase.co"
      )
    ).resolves.toEqual({ ok: true, skipped: true });
    expect(remove).not.toHaveBeenCalled();
  });
});
