import { randomUUID } from "crypto";

export const GALLERY_SUBMISSIONS_BUCKET = "gallery-submissions";
export const GALLERY_PUBLIC_BUCKET = "gallery-images";

type StorageError = { message: string } | null;

type GalleryStorageClient = {
  storage: {
    from(bucket: string): {
      upload(path: string, file: File | Blob, options: { contentType: string; upsert: boolean }): Promise<{ error: StorageError }>;
      download?(path: string): Promise<{ data: Blob | null; error: StorageError }>;
      remove(paths: string[]): Promise<{ error: StorageError }>;
      getPublicUrl(path: string): { data: { publicUrl: string } };
    };
  };
};

function safeFileStem(name: string) {
  const stem = name.replace(/\.[^.]+$/, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return stem || "artwork";
}

function extension(file: File) {
  return file.type === "image/png" ? "png" : "jpg";
}

export function buildGallerySubmissionPath(submissionId: string, file: File) {
  return `pending/${submissionId}-${safeFileStem(file.name)}.${extension(file)}`;
}

export async function uploadGallerySubmissionImage(client: GalleryStorageClient, submissionId: string, file: File) {
  const path = buildGallerySubmissionPath(submissionId, file);
  const { error } = await client.storage.from(GALLERY_SUBMISSIONS_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  return error ? { ok: false as const, error: error.message } : { ok: true as const, path };
}

export async function publishGallerySubmissionImage(client: GalleryStorageClient, submissionId: string, privatePath: string) {
  const publicPath = privatePath.replace(/^pending\//, "approved/");
  const sourceBucket = client.storage.from(GALLERY_SUBMISSIONS_BUCKET);
  if (!sourceBucket.download) return { ok: false as const, error: "Gallery image publishing is unavailable." };
  const { data: image, error: downloadError } = await sourceBucket.download(privatePath);
  if (downloadError || !image) return { ok: false as const, error: downloadError?.message ?? "Gallery image is unavailable." };
  const contentType = image.type || (privatePath.endsWith(".png") ? "image/png" : "image/jpeg");
  const publicBucket = client.storage.from(GALLERY_PUBLIC_BUCKET);
  const { error } = await publicBucket.upload(publicPath, image, { contentType, upsert: false });
  if (error) return { ok: false as const, error: error.message };
  const publicUrl = publicBucket.getPublicUrl(publicPath).data.publicUrl;
  return { ok: true as const, publicPath, publicUrl };
}

export async function deleteGallerySubmissionImage(client: GalleryStorageClient, privatePath: string) {
  const { error } = await client.storage.from(GALLERY_SUBMISSIONS_BUCKET).remove([privatePath]);
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export async function deleteGalleryPublicImage(client: GalleryStorageClient, publicPath: string | null | undefined) {
  if (!publicPath) return { ok: true as const, skipped: true as const };
  const { error } = await client.storage.from(GALLERY_PUBLIC_BUCKET).remove([publicPath]);
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export function createGallerySubmissionId() {
  return randomUUID();
}
