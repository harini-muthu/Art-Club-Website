type AttendanceQrPanelProps = {
  origin: string;
};

function buildAttendanceUrl(origin: string) {
  return new URL("/attendance", origin).toString();
}

function buildQrImageUrl(value: string) {
  const params = new URLSearchParams({
    data: value,
    margin: "16",
    size: "220x220"
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export function AttendanceQrPanel({ origin }: AttendanceQrPanelProps) {
  const attendanceUrl = buildAttendanceUrl(origin);

  return (
    <section className="admin-panel attendance-qr-panel">
      <div className="admin-panel-heading">
        <div>
          <h2>Today&apos;s attendance QR</h2>
          <p>Display this code at meetings so attendees can check in.</p>
        </div>
      </div>
      <div className="attendance-qr-content">
        <object
          aria-label="QR code for attendance check-in"
          className="attendance-qr-image"
          data={buildQrImageUrl(attendanceUrl)}
          type="image/png"
        >
          QR code for attendance check-in
        </object>
        <div className="attendance-qr-link">
          <strong>Public check-in link</strong>
          <p>{attendanceUrl}</p>
          <a className="button secondary" href={attendanceUrl}>
            Open check-in page
          </a>
        </div>
      </div>
    </section>
  );
}
