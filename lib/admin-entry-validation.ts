type FieldErrors = Record<string, string>;

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; fieldErrors: FieldErrors };

const membershipTypes = ["semester", "year"] as const;

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

export type MeetingSubmission = {
  activity: string;
  meeting_date: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  show_on_calendar: boolean;
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

export function validateMemberSubmission(
  formData: FormData
): ValidationResult<MemberSubmission> {
  const fullName = readField(formData, "fullName");
  const email = readField(formData, "email");
  const notes = readField(formData, "notes");
  const membershipType = readField(formData, "membershipType");
  const startsOn = readField(formData, "startsOn");
  const expiresOn = readField(formData, "expiresOn");
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

  if (!isValidDate(startsOn)) {
    fieldErrors.startsOn = "Choose a valid start date.";
  }

  if (!isValidDate(expiresOn)) {
    fieldErrors.expiresOn = "Choose a valid expiration date.";
  } else if (isValidDate(startsOn) && expiresOn < startsOn) {
    fieldErrors.expiresOn = "Expiration date must be on or after the start date.";
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
        starts_on: startsOn,
        expires_on: expiresOn,
        paid_amount: paidAmount
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

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    data: {
      activity,
      meeting_date: meetingDate,
      starts_at: nullIfBlank(startsAt),
      ends_at: nullIfBlank(endsAt),
      location: nullIfBlank(location),
      show_on_calendar: formData.get("showOnCalendar") === "on"
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
