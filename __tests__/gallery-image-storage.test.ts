import { describe, expect, it, vi } from "vitest";
import {
  GALLERY_PUBLIC_BUCKET,
  GALLERY_SUBMISSIONS_BUCKET,
  buildGallerySubmissionPath,
  deleteGallerySubmissionImage,
  publishGallerySubmissionImage,
  uploadGallerySubmissionImage
} from "@/lib/gallery-image-storage";

function createStorageClient(options?: { downloadError?: { message: string } | null; uploadError?: { message: string } | null }) {
  const upload = vi.fn(async () => ({ data: { path: "pending/submission-1-piece.jpg" }, error: null }));
  const download = vi.fn(async () => ({ data: new Blob(["image"], { type: "image/jpeg" }), error: options?.downloadError ?? null }));
  const publicUpload = vi.fn(async () => ({ data: { path: "approved/submission-1-piece.jpg" }, error: options?.uploadError ?? null }));
  const remove = vi.fn(async () => ({ data: [], error: null }));
  const getPublicUrl = vi.fn(() => ({ data: { publicUrl: "https://example.supabase.co/gallery-images/approved/submission-1.jpg" } }));
  const from = vi.fn((bucket: string) => bucket === GALLERY_SUBMISSIONS_BUCKET
    ? { upload, download, remove, getPublicUrl }
    : { upload: publicUpload, remove, getPublicUrl });
  return { client: { storage: { from } }, upload, download, publicUpload, remove, getPublicUrl };
}

describe("gallery image storage", () => {
  it("builds a safe private image path", () => {
    expect(buildGallerySubmissionPath("submission-1", new File(["x"], " Figure!!.PNG", { type: "image/png" }))).toBe("pending/submission-1-figure.png");
  });

  it("uploads originals to the private submission bucket", async () => {
    const { client, upload } = createStorageClient();
    const image = new File(["x"], "piece.jpg", { type: "image/jpeg" });

    await expect(uploadGallerySubmissionImage(client, "submission-1", image)).resolves.toEqual({ ok: true, path: "pending/submission-1-piece.jpg" });
    expect(upload).toHaveBeenCalledWith("pending/submission-1-piece.jpg", image, { contentType: "image/jpeg", upsert: false });
  });

  it("copies an approved original into the public bucket and returns its URL", async () => {
    const { client, download, publicUpload, getPublicUrl } = createStorageClient();

    await expect(publishGallerySubmissionImage(client, "submission-1", "pending/submission-1-piece.jpg")).resolves.toEqual({ ok: true, publicPath: "approved/submission-1-piece.jpg", publicUrl: "https://example.supabase.co/gallery-images/approved/submission-1.jpg" });
    expect(download).toHaveBeenCalledWith("pending/submission-1-piece.jpg");
    expect(publicUpload).toHaveBeenCalledWith("approved/submission-1-piece.jpg", expect.any(Blob), { contentType: "image/jpeg", upsert: false });
    expect(getPublicUrl).toHaveBeenCalledWith("approved/submission-1-piece.jpg");
  });

  it("does not expose a URL when the public copy fails", async () => {
    const { client } = createStorageClient({ uploadError: { message: "copy failed" } });
    await expect(publishGallerySubmissionImage(client, "submission-1", "pending/submission-1-piece.jpg")).resolves.toEqual({ ok: false, error: "copy failed" });
  });

  it("deletes private submission images", async () => {
    const { client, remove } = createStorageClient();
    await expect(deleteGallerySubmissionImage(client, "pending/submission-1-piece.jpg")).resolves.toEqual({ ok: true });
    expect(remove).toHaveBeenCalledWith(["pending/submission-1-piece.jpg"]);
  });
});
