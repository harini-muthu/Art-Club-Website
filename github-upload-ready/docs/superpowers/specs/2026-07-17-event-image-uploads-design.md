# Event Image Uploads Design

## Summary

Admins should be able to upload a JPG or PNG image for an event/activity instead of pasting an external image URL. Uploaded event images appear on the public Events page above the event information, keeping the current event-card layout while making the admin workflow easier for officers.

## Scope

This change covers event/activity images only. It does not add gallery artwork uploads, member artwork submissions, image review queues, image editing/cropping, or private media access.

## Recommended Approach

Use Supabase Storage with a public `event-images` bucket. The site already stores event image references in `meetings.image_url`, so the upload flow can continue storing a rendered image URL there after a successful upload.

The bucket should allow public reads because event images are intentionally displayed on the public Events page. Upload, replace, and delete access should be limited to authenticated officers through Supabase Storage policies.

## Admin Workflow

The Add Activity form changes from an `Image URL` field to a file picker that accepts `.jpg`, `.jpeg`, and `.png`.

The Edit Activity form should allow admins to keep the existing image, replace it with a new JPG/PNG, or remove it. If an event is deleted, its uploaded image should be deleted from storage as part of the same server action when possible.

The image description field remains available and maps to `meetings.image_alt`.

## Data Flow

1. Admin submits an activity form with optional image file.
2. Server action validates the event fields and validates the file type/size.
3. If an image is present, the server uploads it to Supabase Storage under `events/<event-id-or-generated-id>/<safe-file-name>`.
4. The server stores the image public URL in `meetings.image_url` and the description in `meetings.image_alt`.
5. The public Events page reads `meetings.image_url` and displays the image above the event information.

## Validation

Accepted image MIME types:

- `image/jpeg`
- `image/png`

Recommended maximum size: 5 MB.

If the image is invalid or the upload fails, the activity should not silently save as successful. The admin should be redirected back with an activity error, matching the current admin action style.

## Supabase Changes

Add SQL for:

- Creating the `event-images` storage bucket.
- Public read access for files in that bucket.
- Officer-only insert, update, and delete policies for the bucket.

The existing `meetings.image_url` and `meetings.image_alt` columns can continue to be used.

The upload implementation should also be able to recognize URLs from the `event-images` bucket so it can delete or replace only files owned by this app. External image URLs, if any remain in older rows, should not be deleted by cleanup code.

## Event Display

The public Events page should continue to render event images above the event copy. If no uploaded image exists, the current fallback tile should still appear.

## Testing

Add or update tests for:

- JPG/PNG file validation.
- Rejection of unsupported file types.
- Server action upload path for new activities.
- Server action replace/remove behavior for edited activities.
- Event deletion cleaning up storage when an uploaded image exists.
- Public event display still using `image_url` above event details.

Run:

- `npm test`
- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`
