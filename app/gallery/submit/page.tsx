import Link from "next/link";
import { GallerySubmissionForm } from "@/components/gallery-submission-form";

export default async function GallerySubmitPage({ searchParams }: { searchParams: Promise<{ error?: string; submitted?: string }> }) {
  const params = await searchParams;
  return <>
    <section className="page-hero compact-hero"><p className="eyebrow">Member gallery</p><h1>Share your artwork.</h1><p>Active members can submit one artwork photo for officer review.</p></section>
    <section className="page-section"><GallerySubmissionForm error={params.error === "invalid-submission"} submitted={params.submitted === "1"} />{!params.submitted ? <p><Link href="/gallery">Return to gallery</Link></p> : null}</section>
  </>;
}
