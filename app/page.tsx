import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const supabase = await createClient();

  // 1. Check user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // 2. Fetch the profile using the new 'roles' array column
  const { data: profile } = await supabase
    .from("profiles")
    .select("roles") // Changed from 'role' to 'roles'
    .eq("id", user.id)
    .single();

  // 3. Logic-based redirection (Array check)
  const roles = profile?.roles || [];

  if (roles.includes("admin")) {
    redirect("/admin");
  } 
  
  // Agente, Worker, ya Assessor sab ko /worker dashboard par bhejein
  if (roles.some(r => ["worker", "assessor", "agent"].includes(r))) {
    redirect("/worker");
  }

  // Fallback: Agar koi role nahi hai toh logout karke login par bhej dein
  redirect("/login");
}