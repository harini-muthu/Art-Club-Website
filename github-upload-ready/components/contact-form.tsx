"use client";

import { FormEvent, useState } from "react";
import {
  contactPurposeOptions,
  validateContactSubmission
} from "@/lib/contact-validation";

type FormState = {
  nameOrOrganization: string;
  email: string;
  purpose: string;
  message: string;
  website: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

const initialFormState: FormState = {
  nameOrOrganization: "",
  email: "",
  purpose: "general",
  message: "",
  website: ""
};

export function ContactForm() {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [formMessage, setFormMessage] = useState("");

  function updateField(field: keyof FormState, value: string) {
    setFormState((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage("");

    const validation = validateContactSubmission(formState);
    if (!validation.ok) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    setSubmitState("submitting");
    setFieldErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validation.data)
      });
      const result = (await response.json()) as {
        ok: boolean;
        fieldErrors?: Record<string, string>;
        message?: string;
      };

      if (result.ok) {
        setFormState(initialFormState);
        setSubmitState("success");
        return;
      }

      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
      }
      setFormMessage(
        result.message ||
          "We could not send your message right now. Please try again."
      );
      setSubmitState("error");
    } catch {
      setFormMessage("We could not send your message right now. Please try again.");
      setSubmitState("error");
    }
  }

  return (
    <>
      <form className="contact-form" onSubmit={submitForm} noValidate>
        <div className="form-field">
          <label htmlFor="nameOrOrganization">Name or organization</label>
          <input
            id="nameOrOrganization"
            name="nameOrOrganization"
            type="text"
            value={formState.nameOrOrganization}
            onChange={(event) =>
              updateField("nameOrOrganization", event.target.value)
            }
            aria-describedby={
              fieldErrors.nameOrOrganization
                ? "nameOrOrganization-error"
                : undefined
            }
          />
          {fieldErrors.nameOrOrganization ? (
            <p className="field-error" id="nameOrOrganization-error">
              {fieldErrors.nameOrOrganization}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formState.email}
            onChange={(event) => updateField("email", event.target.value)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          {fieldErrors.email ? (
            <p className="field-error" id="email-error">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="purpose">Purpose</label>
          <select
            id="purpose"
            name="purpose"
            value={formState.purpose}
            onChange={(event) => updateField("purpose", event.target.value)}
            aria-describedby={fieldErrors.purpose ? "purpose-error" : undefined}
          >
            {contactPurposeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors.purpose ? (
            <p className="field-error" id="purpose-error">
              {fieldErrors.purpose}
            </p>
          ) : null}
        </div>

        <div className="form-field">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            rows={7}
            value={formState.message}
            onChange={(event) => updateField("message", event.target.value)}
            aria-describedby={fieldErrors.message ? "message-error" : undefined}
          />
          {fieldErrors.message ? (
            <p className="field-error" id="message-error">
              {fieldErrors.message}
            </p>
          ) : null}
        </div>

        <div className="honeypot-field" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={formState.website}
            onChange={(event) => updateField("website", event.target.value)}
          />
        </div>

        {formMessage ? <p className="form-error">{formMessage}</p> : null}

        <button
          className="button primary"
          type="submit"
          disabled={submitState === "submitting"}
        >
          {submitState === "submitting" ? "Sending..." : "Send message"}
        </button>
      </form>

      {submitState === "success" ? (
        <div className="confirmation-backdrop" role="presentation">
          <div
            aria-labelledby="contact-success-title"
            className="confirmation-modal"
            role="dialog"
          >
            <p className="eyebrow">Sent</p>
            <h2 id="contact-success-title">Message sent</h2>
            <p>
              Your message has been sent to the club inbox, and a confirmation
              email is on its way to you.
            </p>
            <button
              className="button secondary"
              type="button"
              onClick={() => setSubmitState("idle")}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
