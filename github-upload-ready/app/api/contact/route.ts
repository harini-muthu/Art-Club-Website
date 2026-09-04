import { clubName } from "@/lib/site-data";
import {
  ContactSubmission,
  getContactPurposeLabel,
  validateContactSubmission
} from "@/lib/contact-validation";

const resendEndpoint = "https://api.resend.com/emails";
const configErrorMessage =
  "Email sending is not configured yet. Please email the club directly.";
const sendErrorMessage =
  "We could not send your message right now. Please try again or email the club directly.";

type EmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function requireEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !toEmail || !fromEmail) {
    return null;
  }

  return { apiKey, toEmail, fromEmail };
}

async function sendResendEmail(apiKey: string, payload: EmailPayload) {
  const response = await fetch(resendEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Resend rejected email with status ${response.status}`);
  }
}

function clubNotificationEmail(
  submission: ContactSubmission,
  fromEmail: string,
  toEmail: string
): EmailPayload {
  const purposeLabel = getContactPurposeLabel(submission.purpose);
  const safeName = escapeHtml(submission.nameOrOrganization);
  const safeEmail = escapeHtml(submission.email);
  const safePurpose = escapeHtml(purposeLabel);
  const safeMessage = escapeHtml(submission.message).replaceAll("\n", "<br />");

  return {
    from: fromEmail,
    to: [toEmail],
    reply_to: submission.email,
    subject: `${clubName} contact: ${purposeLabel}`,
    html: `
      <h1>New ${clubName} contact request</h1>
      <p><strong>Name or organization:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Purpose:</strong> ${safePurpose}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `,
    text: [
      `New ${clubName} contact request`,
      `Name or organization: ${submission.nameOrOrganization}`,
      `Email: ${submission.email}`,
      `Purpose: ${purposeLabel}`,
      "",
      submission.message
    ].join("\n")
  };
}

function requesterReplyEmail(
  submission: ContactSubmission,
  fromEmail: string
): EmailPayload {
  const replyName = process.env.CONTACT_REPLY_NAME || clubName;

  return {
    from: fromEmail,
    to: [submission.email],
    subject: `We received your ${clubName} message`,
    html: `
      <p>Hi ${escapeHtml(submission.nameOrOrganization)},</p>
      <p>Thanks for reaching out to ${escapeHtml(replyName)}. We received your message and it has been sent to the club inbox.</p>
      <p>If you need to add anything, you can reply to your original email thread with the club.</p>
    `,
    text: [
      `Hi ${submission.nameOrOrganization},`,
      "",
      `Thanks for reaching out to ${replyName}. We received your message and it has been sent to the club inbox.`,
      "If you need to add anything, you can reply to your original email thread with the club."
    ].join("\n")
  };
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return Response.json(
      { ok: false, fieldErrors: { message: "Enter a message." } },
      { status: 400 }
    );
  }

  const validation = validateContactSubmission(payload);
  if (!validation.ok) {
    return Response.json(
      { ok: false, fieldErrors: validation.fieldErrors },
      { status: 400 }
    );
  }

  const config = requireEmailConfig();
  if (!config) {
    return Response.json(
      { ok: false, message: configErrorMessage },
      { status: 503 }
    );
  }

  try {
    await Promise.all([
      sendResendEmail(
        config.apiKey,
        clubNotificationEmail(validation.data, config.fromEmail, config.toEmail)
      ),
      sendResendEmail(
        config.apiKey,
        requesterReplyEmail(validation.data, config.fromEmail)
      )
    ]);
  } catch {
    return Response.json(
      { ok: false, message: sendErrorMessage },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
