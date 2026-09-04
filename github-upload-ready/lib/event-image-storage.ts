import { randomUUID } from "node:crypto";

export const EVENT_IMAGE_BUCKET = "event-images";

type StorageError = { message: string } | null;

type EventImageBucketClient = {
  getPublicUrl(path: string): { data: { publicUrl: string } };
  remove(paths: string[]): Promise<{ error: StorageError }>;
  upload(
    path: string,
    file: File,
    options: { contentType: string; upsert: boolean }
  ): Promise<{ error: StorageError }>;
};

type EventImageStorageClient = {
  storage: {
    from(bucket: string): EventImageBucketClient;
  };
};

type UploadEventImageOptions = {
  scopeId?: string;
  uploadId?: string;
};

function safeSegment(value: string, fallback: string) {
  const safeValue = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return safeValue || fallback;
}

function extensionForFile(file: File) {
  return file.type === "image/png" ? "png" : "jpg";
}

function fileBaseName(file: File) {
  return file.name.replace(/\.[^.]+$/, "");
}

export function buildEventImagePath(
  scopeId: string,
  file: File,
  uploadId: string = randomUUID()
) {
  const safeScope = safeSegment(scopeId, "event");
  const safeUploadId = safeSegment(uploadId, "upload");
  const safeName = safeSegment(fileBaseName(file), "event-image");
  const extension = extensionForFile(file);

  return `events/${safeScope}/${safeUploadId}-${safeName}.${extension}`;
}

export function getEventImagePathFromPublicUrl(
  publicUrl: string | null | undefined,
  supabaseUrl: string
) {
  if (!publicUrl) {
    return null;
  }

  try {
    const parsedPublicUrl = new URL(publicUrl);
    const parsedSupabaseUrl = new URL(supabaseUrl);

    if (parsedPublicUrl.origin !== parsedSupabaseUrl.origin) {
      return null;
    }

    const prefix = `/storage/v1/object/public/${EVENT_IMAGE_BUCKET}/`;

    if (!parsedPublicUrl.pathname.startsWith(prefix)) {
      return null;
    }

    const path = decodeURIComponent(parsedPublicUrl.pathname.slice(prefix.length));
    return path || null;
  } catch {
    return null;
  }
}

export async function uploadEventImage(
  supabase: EventImageStorageClient,
  file: File,
  options: UploadEventImageOptions = {}
) {
  const path = buildEventImagePath(
    options.scopeId ?? "event",
    file,
    options.uploadId
  );
  const bucket = supabase.storage.from(EVENT_IMAGE_BUCKET);
  const { error } = await bucket.upload(path, file, {
    contentType: file.type,
    upsert: true
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const {
    data: { publicUrl }
  } = bucket.getPublicUrl(path);

  return { ok: true as const, path, publicUrl };
}

export async function deleteEventImage(
  supabase: EventImageStorageClient,
  publicUrl: string | null | undefined,
  supabaseUrl: string
) {
  const path = getEventImagePathFromPublicUrl(publicUrl, supabaseUrl);

  if (!path) {
    return { ok: true as const, skipped: true as const };
  }

  const { error } = await supabase.storage
    .from(EVENT_IMAGE_BUCKET)
    .remove([path]);

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
