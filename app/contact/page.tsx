import { ContactForm } from "@/components/contact-form";
import { PageSection } from "@/components/page-section";
import { clubEmail } from "@/lib/site-data";

export default function ContactPage() {
  return (
    <>
      <section className="page-hero contact-hero">
        <p className="eyebrow">Contact</p>
        <h1>Start a conversation with the club.</h1>
        <p>
          Send a note to the club inbox for questions, collaborations, meeting
          ideas, or event requests.
        </p>
      </section>

      <PageSection
        title="Send a request"
        intro="Share the essentials and an officer can reply from the club inbox."
      >
        <div className="contact-layout">
          <ContactForm />

          <aside className="contact-note">
            <p className="eyebrow">Direct email</p>
            <h2>Email the club directly</h2>
            <p>
              If the form is not working or you need to follow up on an earlier
              conversation, you can still reach the club through email.
            </p>
            <a className="email-link" href={`mailto:${clubEmail}`}>
              {clubEmail}
            </a>
          </aside>
        </div>
      </PageSection>
    </>
  );
}
