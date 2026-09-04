export const statusMessages: Record<string, string> = {
  "activity-added": "Activity added.",
  "activity-deleted": "Activity deleted.",
  "activity-updated": "Activity updated.",
  "attendance-added": "Attendance recorded.",
  "member-added": "Member and membership added.",
  "member-deleted": "Member deleted.",
  "member-updated": "Member updated.",
  "officer-added": "Officer added.",
  "officer-deleted": "Officer deleted.",
  "officer-updated": "Officer updated."
};

export const errorMessages: Record<string, string> = {
  "activity-invalid": "Check the activity fields and try again.",
  "activity-save-failed": "Activity could not be saved. Check Supabase policies.",
  "attendance-invalid": "Choose a meeting and identify the attendee.",
  "attendance-save-failed": "Attendance could not be saved. Check Supabase policies.",
  "member-invalid": "Check the member fields and try again.",
  "member-save-failed": "Member could not be saved. Check Supabase policies.",
  "officer-final-delete": "Keep at least one officer so admin access is not locked out.",
  "officer-invalid": "Check the officer fields and try again.",
  "officer-save-failed": "Officer could not be saved. Check Supabase policies."
};
