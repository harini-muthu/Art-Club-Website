export type MembershipStatus = "active" | "expired";

export type AdminMember = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  notes?: string | null;
};

export type AdminMembership = {
  id?: string | null;
  member_id: string | null;
  membership_type?: string | null;
  starts_on?: string | null;
  expires_on: string;
  paid_amount?: number | string | null;
};

export type AdminMeeting = {
  id: string;
  activity?: string | null;
  meeting_date?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  location?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  show_on_calendar?: boolean | null;
};

export type AdminAttendanceRecord = {
  member_id: string | null;
  attendee_name?: string | null;
  checked_in_at?: string | null;
};

export type OfficerRecord = {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  focus?: string | null;
};

export type AdminDashboardData = {
  members: AdminMember[];
  memberships: AdminMembership[];
  meetings: AdminMeeting[];
  attendanceRecords: AdminAttendanceRecord[];
};

export function getMembershipStatus(
  expiresOn: string,
  now: Date = new Date()
): MembershipStatus {
  const expirationDate = new Date(`${expiresOn}T23:59:59Z`);
  return expirationDate >= now ? "active" : "expired";
}

export function getMemberAttendanceCount(
  memberId: string,
  attendanceRecords: AdminAttendanceRecord[]
) {
  return attendanceRecords.filter((record) => record.member_id === memberId)
    .length;
}

export function filterMembersBySearch(
  members: AdminMember[],
  searchTerm: string
) {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  if (!normalizedSearchTerm) {
    return members;
  }

  return members.filter((member) => {
    const fullName = member.full_name?.toLowerCase() ?? "";
    const email = member.email?.toLowerCase() ?? "";
    return (
      fullName.includes(normalizedSearchTerm) ||
      email.includes(normalizedSearchTerm)
    );
  });
}

function getOfficerRolePriority(role: string) {
  const normalizedRole = role.toLowerCase();

  if (/\bpresident\b/.test(normalizedRole) && !/\bvice president\b/.test(normalizedRole)) {
    return 0;
  }

  if (/\bvp\b/.test(normalizedRole) || /\bvice president\b/.test(normalizedRole)) {
    return 1;
  }

  if (/\btreasurer\b/.test(normalizedRole)) {
    return 2;
  }

  if (/\bsecretary\b/.test(normalizedRole)) {
    return 3;
  }

  return 4;
}

export function sortOfficersForDisplay<T extends OfficerRecord>(officers: T[]) {
  return [...officers].sort((a, b) => {
    const priorityDifference =
      getOfficerRolePriority(a.role) - getOfficerRolePriority(b.role);

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    return a.name.localeCompare(b.name);
  });
}

export function buildAdminDashboardStats(
  data: AdminDashboardData,
  now: Date = new Date()
) {
  const activeMemberIds = new Set(
    data.memberships
      .filter((membership) => getMembershipStatus(membership.expires_on, now) === "active")
      .map((membership) => membership.member_id)
      .filter(Boolean)
  );

  return {
    totalMembers: data.members.length,
    activeMembers: activeMemberIds.size,
    calendarActivities: data.meetings.filter(
      (meeting) => meeting.show_on_calendar !== false
    ).length,
    attendanceRecords: data.attendanceRecords.length
  };
}
