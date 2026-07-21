import { networkInterfaces } from "node:os";

type AttendanceQrOriginInput = {
  forwardedHost?: string | null;
  forwardedProto?: string | null;
  host?: string | null;
  lanAddress?: string | null;
};

function splitHostAndPort(host: string) {
  const [hostname, port] = host.split(":");
  return { hostname, port };
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getLocalLanAddress() {
  const interfaces = networkInterfaces();

  for (const addresses of Object.values(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }

  return null;
}

export function getAttendanceQrOrigin({
  forwardedHost,
  forwardedProto,
  host,
  lanAddress
}: AttendanceQrOriginInput) {
  const requestHost = forwardedHost ?? host ?? "localhost:3000";
  const protocol = forwardedProto ?? "http";
  const { hostname, port } = splitHostAndPort(requestHost);

  if (isLocalHostname(hostname) && lanAddress) {
    return `${protocol}://${lanAddress}${port ? `:${port}` : ""}`;
  }

  return `${protocol}://${requestHost}`;
}
