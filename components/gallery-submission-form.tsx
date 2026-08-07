import { submitGalleryArtwork } from "@/app/gallery/submit/actions";

export function GallerySubmissionForm({ error, submitted }: { error?: boolean; submitted?: boolean }) {
  if (submitted) return <section className="gallery-submit-message" aria-live="polite"><h2>Artwork received</h2><p>Your submission is awaiting officer review. We’ll contact you manually if follow-up is needed.</p></section>;

  return <form action={submitGalleryArtwork} className="gallery-submission-form" encType="multipart/form-data">
    <h2>Submit artwork</h2>
    <p>Submit one photo of your original artwork for officer review.</p>
    {error ? <p className="form-error" role="alert">We couldn’t accept that submission. Check your details and confirm you have an active membership.</p> : null}
    <label>School email<input name="schoolEmail" required type="email" /></label>
    <label>Artwork title<input name="title" required type="text" /></label>
    <label>Class year<input name="classYear" placeholder="2027" required type="text" /></label>
    <label>Medium<input name="medium" placeholder="Oil on canvas" required type="text" /></label>
    <label>Dimensions<input name="dimensions" placeholder="24 x 30 in." required type="text" /></label>
    <label>Artist statement<textarea name="statement" required rows={5} /></label>
    <label>Artwork photo (JPG or PNG, 1 MB maximum)<input accept=".jpg,.jpeg,.png,image/jpeg,image/png" name="image" required type="file" /></label>
    <label className="admin-checkbox"><input name="consent" required type="checkbox" />I own this work and allow the club to publish it in the gallery.</label>
    <button className="button primary" type="submit">Send for review</button>
  </form>;
}
