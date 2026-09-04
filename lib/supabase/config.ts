export type SupabaseBrowserConfig = {
  url: string;
  publishableKey: string;
};

export type OfficerProvisioningConfig = SupabaseBrowserConfig & {
  serviceRoleKey: string;
  sharedPassword: string;
};

const missingConfigError =
  "Supabase environment variables are not configured.";

export function hasSupabaseBrowserConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
  );
}

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

  if (!url || !publishableKey) {
    throw new Error(missingConfigError);
  }

  return { url, publishableKey };
}

export function getOfficerProvisioningConfig(): OfficerProvisioningConfig {
  const browserConfig = getSupabaseBrowserConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const sharedPassword = process.env.OFFICER_SHARED_PASSWORD ?? "";

  if (!serviceRoleKey || !sharedPassword) {
    throw new Error("Officer provisioning environment variables are not configured.");
  }

  return { ...browserConfig, serviceRoleKey, sharedPassword };
}
