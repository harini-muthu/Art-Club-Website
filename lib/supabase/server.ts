import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getOfficerProvisioningConfig,
  getSupabaseBrowserConfig
} from "@/lib/supabase/config";

export async function createClient() {
  const { url, publishableKey } = getSupabaseBrowserConfig();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies during render.
          // Auth flows that need writes happen through client navigation/actions.
        }
      }
    }
  });
}

export async function createAdminClient() {
  const { url, serviceRoleKey } = getOfficerProvisioningConfig();

  return createServerClient(url, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Admin provisioning does not use a browser session.
      }
    }
  });
}
