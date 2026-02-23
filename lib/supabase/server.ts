// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js"; // Standard client for admin
import { cookies } from "next/headers";
import { Database } from "@/types/database";

// 1. STANDARD CLIENT (Use for 99% of the app)
export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Managed by middleware
          }
        },
      },
    },
  );
};

// 2. ADMIN CLIENT (Use ONLY for Admin Server Actions)
export const createAdminClient = async () => {
  // We don't use createServerClient here because we want to 
  // bypass RLS and cookies using the Service Role Key.
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Ensure this is in your .env
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};