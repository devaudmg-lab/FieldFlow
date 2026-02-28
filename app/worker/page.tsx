import { createClient } from "@/lib/supabase/server"; // Ensure this path is correct for your server client
import { redirect } from "next/navigation";
import WorkerDashboard from "@/components/worker/WorkerDashboard";
import { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default async function WorkerPage() {
  const supabase = await createClient();

  // 1. Authenticated User ka session lein
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();


  // Agar login nahi hai, toh wapas bhej do
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Profile table se Role fetch karein
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", user.id)
    .single();

const profile = profileData as unknown as ProfileRow;

  // Agar profile setup nahi hai toh error dikhao
  if (profileError || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="p-8 bg-white rounded-2xl shadow-sm border border-red-100 text-center">
          <p className="text-red-600 font-bold">Profile Configuration Error</p>
          <p className="text-slate-500 text-sm mt-1">
            Please ask your Admin to set a role for your account.
          </p>
        </div>
      </div>
    );
  }

  // 3. WorkerDashboard ko props pass karein
  // profile.role agar "assessor,agent" hai toh wo pura string yaha jayega
  return <WorkerDashboard userId={user.id} userRole={profile.roles} />;
}
