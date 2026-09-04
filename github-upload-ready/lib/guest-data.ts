export type GuestAttendanceRecord = {
  guest_id?: string | null;
};

export type GuestSearchRecord = {
  id: string;
  full_name?: string | null;
  notes?: string | null;
};

export function normalizeGuestName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function getGuestAttendanceCount(
  guestId: string,
  attendanceRecords: GuestAttendanceRecord[]
) {
  return attendanceRecords.filter((record) => record.guest_id === guestId).length;
}

export function filterGuestsBySearch<T extends GuestSearchRecord>(
  guests: T[],
  searchTerm: string
) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) return guests;

  return guests.filter((guest) =>
    (guest.full_name ?? "").toLowerCase().includes(normalizedSearch) ||
    (guest.notes ?? "").toLowerCase().includes(normalizedSearch)
  );
}
