import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Database } from "@/types/database";

// Define the type for the profile row
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default async function RootPage() {
  const supabase = await createClient();

  // 1. Check user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // If no user, send to login immediately
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch the profile using the 'roles' array column
  const { data: profileData } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

  /**
   * THE FIX:
   * Cast to unknown first to avoid the 'never' overlap error, 
   * then to our known ProfileRow type.
   */
  const profile = profileData as unknown as ProfileRow;
  const roles = profile?.roles || [];

  // 3. Logic-based redirection (Array check)
  
  // High Priority: Admins
  if (roles.includes("admin")) {
    redirect("/admin");
  } 
  
  // Medium Priority: Field Team (Assessor, Worker, Agent)
  const isFieldTeam = roles.some(r => 
    ["worker", "assessor", "agent"].includes(r)
  );

  if (isFieldTeam) {
    redirect("/worker");
  }

  // 4. Fallback: If no recognized roles are found
  // This prevents users with no roles from getting stuck on a blank page
  redirect("/login");
}