type FieldErrors = Record<string, string>;

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors };

const membershipTypes = ["semester", "year"] as const;
const acceptedEventImageTypes = ["image/jpeg", "image/png"];
export const maxEventImageSize = 5 * 1024 * 1024;

type MembershipType = (typeof membershipTypes)[number];

export type MemberSubmission = {
  member: {
    full_name: string;
    email: string | null;
    notes: string | null;
  };
  membership: {
    membership_type: MembershipType;
    starts_on: string;
    expires_on: string;
    paid_amount: number | null;
  };
};

export type MemberUpdateSubmission = MemberSubmission & {
  member_id: string;
  membership_id: string | null;
};

export type MeetingSubmission = {
  activity: string;
  meeting_date: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  image_file: File | null;
  image_url: string | null;
  current_image_url: string | null;
  image_alt: string | null;
  remove_image: boolean;
  show_on_calendar: boolean;
};

export type MeetingUpdateSubmission = MeetingSubmission & {
  meeting_id: string;
};

export type AttendanceSubmission = {
  meeting_id: string;
  member_id: string | null;
  attendee_name: string | null;
};

function readField(formData: FormData, field: string) {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function nullIfBlank(value: string) {
  return value ? value : null;
}

function readOptionalFile(formData: FormData, field: string) {
  const value = formData.get(field);

  if (
    typeof File !== "undefined" &&
    value instanceof File &&
    value.name &&
    value.size > 0
  ) {
    return value;
  }

  return null;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value);
}

function isValidOptionalTime(value: string) {
  return value === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function isValidOptionalEmail(value: string) {
  return value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidOptionalUrl(value: string) {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateOptionalEventImageFile(
  file: File | null,
  fieldErrors: FieldErrors
) {
  if (!file) {
    return;
  }

  if (!acceptedEventImageTypes.includes(file.type)) {
    fieldErrors.eventImage = "Upload a JPG or PNG image.";
    return;
  }

  if (file.size > maxEventImageSize) {
    fieldErrors.eventImage = "Image must be 5 MB or smaller.";
  }
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getMembershipTerm(
  membershipType: MembershipType,
  now: Date = new Date()
) {
  const addedYear = now.getUTCFullYear();

  return {
    starts_on: dateOnly(now),
    expires_on:
      membershipType === "semester"
        ? `${addedYear}-12-31`
        : `${addedYear + 1}-05-31`
  };
}

export function validateMemberSubmission(
  formData: FormData,
  now: Date = new Date()
): ValidationResult<MemberSubmission> {
  const fullName = readField(formData, "fullName");
  const email = readField(formData, "email");
  const notes = readField(formData, "notes");
  const membershipType = readField(formData, "membershipType");
  const paidAmountInput = readField(formData, "paidAmount");
  const paidAmount = paidAmountInput ? Number(paidAmountInput) : null;
  const fieldErrors: FieldErrors = {};

  if (!fullName) {
    fieldErrors.fullName = "Enter the member's full name.";
  }

  if (!isValidOptionalEmail(email)) {
    fieldErrors.email = "Enter a valid email address or leave it blank.";
  }

  if (!membershipTypes.includes(membershipType as MembershipType)) {
    fieldErrors.membershipType = "Choose semester or year.";
  }

  if (paidAmount !== null && (!Number.isFinite(paidAmount) || paidAmount < 0)) {
    fieldErrors.paidAmount = "Paid amount must be zero or more.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      member: {
        full_name: fullName,
        email: nullIfBlank(email),
        notes: nullIfBlank(notes)
      },
      membership: {
        membership_type: membershipType as MembershipType,
        ...getMembershipTerm(membershipType as MembershipType, now),
        paid_amount: paidAmount
      }
    }
  };
}

export function validateMemberUpdateSubmission(
  formData: FormData,
  now: Date = new Date()
): ValidationResult<MemberUpdateSubmission> {
  const memberId = readField(formData, "memberId");
  const membershipId = readField(formData, "membershipId");
  const originalMembershipType = readField(formData, "originalMembershipType");
  const startsOn = readField(formData, "startsOn");
  const expiresOn = readField(formData, "expiresOn");
  const validation = validateMemberSubmission(formData, now);
  const fieldErrors: FieldErrors = {};

  if (!memberId) {
    fieldErrors.memberId = "Choose a member.";
  }

  if (!validation.ok || Object.keys(fieldErrors).length > 0) {
    if (!validation.ok) {
      Object.assign(fieldErrors, validation.fieldErrors);
    }
    return { ok: false, fieldErrors };
  }

  const memberData = validation.data;
  const membershipChanged =
    originalMembershipType &&
    originalMembershipType !== memberData.membership.membership_type;
  const keepExistingDates =
    !membershipChanged && isValidDate(startsOn) && isValidDate(expiresOn);

  return {
    ok: true,
    data: {
      member_id: memberId,
      membership_id: nullIfBlank(membershipId),
      member: memberData.member,
      membership: {
        ...memberData.membership,
        starts_on: keepExistingDates
          ? startsOn
          : memberData.membership.starts_on,
        expires_on: keepExistingDates
          ? expiresOn
          : memberData.membership.expires_on
      }
    }
  };
}

export function validateMeetingSubmission(
  formData: FormData
): ValidationResult<MeetingSubmission> {
  const activity = readField(formData, "activity");
  const meetingDate = readField(formData, "meetingDate");
  const startsAt = readField(formData, "startsAt");
  const endsAt = readField(formData, "endsAt");
  const location = readField(formData, "location");
  const currentImageUrl = readField(formData, "currentImageUrl");
  const imageFile = readOptionalFile(formData, "eventImage");
  const imageAlt = readField(formData, "imageAlt");
  const removeImage = formData.get("removeImage") === "on";
  const fieldErrors: FieldErrors = {};

  if (!activity) {
    fieldErrors.activity = "Enter the activity name.";
  }

  if (!isValidDate(meetingDate)) {
    fieldErrors.meetingDate = "Choose a valid meeting date.";
  }

  if (!isValidOptionalTime(startsAt)) {
    fieldErrors.startsAt = "Choose a valid start time.";
  }

  if (!isValidOptionalTime(endsAt)) {
    fieldErrors.endsAt = "Choose a valid end time.";
  } else if (startsAt && endsAt && endsAt < startsAt) {
    fieldErrors.endsAt = "End time must be after the start time.";
  }

  if (!isValidOptionalUrl(currentImageUrl)) {
    fieldErrors.currentImageUrl = "Existing image URL is invalid.";
  }

  validateOptionalEventImageFile(imageFile, fieldErrors);

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  const preservedImageUrl = removeImage ? null : nullIfBlank(currentImageUrl);

  return {
    ok: true,
    data: {
      activity,
      meeting_date: meetingDate,
      starts_at: nullIfBlank(startsAt),
      ends_at: nullIfBlank(endsAt),
      location: nullIfBlank(location),
      image_file: imageFile,
      image_url: imageFile ? null : preservedImageUrl,
      current_image_url: nullIfBlank(currentImageUrl),
      image_alt: nullIfBlank(imageAlt),
      remove_image: removeImage,
      show_on_calendar: formData.get("showOnCalendar") === "on"
    }
  };
}

export function validateMeetingUpdateSubmission(
  formData: FormData
): ValidationResult<MeetingUpdateSubmission> {
  const meetingId = readField(formData, "meetingId");
  const validation = validateMeetingSubmission(formData);
  const fieldErrors: FieldErrors = {};

  if (!meetingId) {
    fieldErrors.meetingId = "Choose an activity.";
  }

  if (!validation.ok || Object.keys(fieldErrors).length > 0) {
    if (!validation.ok) {
      Object.assign(fieldErrors, validation.fieldErrors);
    }
    return { ok: false, fieldErrors };
  }

  const meetingData = validation.data;
  return {
    ok: true,
    data: {
      meeting_id: meetingId,
      ...meetingData
    }
  };
}

export function validateAttendanceSubmission(
  formData: FormData
): ValidationResult<AttendanceSubmission> {
  const meetingId = readField(formData, "meetingId");
  const memberId = readField(formData, "memberId");
  const attendeeName = readField(formData, "attendeeName");
  const fieldErrors: FieldErrors = {};

  if (!meetingId) {
    fieldErrors.meetingId = "Choose a meeting.";
  }

  if (!memberId && !attendeeName) {
    fieldErrors.attendeeName = "Choose a member or enter an attendee name.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      meeting_id: meetingId,
      member_id: nullIfBlank(memberId),
      attendee_name: nullIfBlank(attendeeName)
    }
  };
}
