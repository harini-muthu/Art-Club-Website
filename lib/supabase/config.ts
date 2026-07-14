export type SupabaseBrowserConfig = {
  url: string;
  publishableKey: string;
};

const missingConfigError =
  "Supabase environment variables are not configured.";

function readEnvValue(key: string) {
  return process.env[key]?.trim() ?? "";
}

export function hasSupabaseBrowserConfig() {
  return Boolean(
    readEnvValue("NEXT_PUBLIC_SUPABASE_URL") &&
      readEnvValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );
}

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig {
  const url = readEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = readEnvValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  if (!url || !publishableKey) {
    throw new Error(missingConfigError);
  }

  return { url, publishableKey };
}
