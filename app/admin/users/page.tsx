import { createClient } from "@/lib/supabase/server";
import UserCreationForm from "@/components/admin/UserCreationForm";
import UserManagementTable from "@/components/admin/UserManagementTable";
import { Users, UserPlus } from "lucide-react";

export const metadata = {
  title: "User Management | Admin",
};

export default async function UsersPage() {
  const supabase = await createClient();

  // FIX: Remove the .eq filter here so that ALL aliases are fetched.
  // This allows the Edit Modal to show the full alias history.
  const { data: users, error } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      roles,
      is_active,
      profile_aliases(
        alias_name,
        is_primary
      )
    `)
    .order("username", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
  }

  return (
    <div className="container mx-auto space-y-10 pb-20 pt-8 px-4">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <Users className="text-blue-600" size={28} />
          </div>
          Staff Management
        </h1>
        <p className="text-slate-500 max-w-2xl text-sm md:text-base">
          Create new system users, assign multiple roles, and manage their identification aliases. 
          The primary alias is used as the main display name across the application.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
        {/* Left Column: Creation Form */}
        <section className="xl:col-span-4 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <UserPlus size={18} className="text-blue-500" />
            <h2 className="font-bold text-slate-700 uppercase text-[11px] tracking-widest">
              Create New Account
            </h2>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5 transition-all hover:shadow-md">
            <UserCreationForm />
          </div>
        </section>

        {/* Right Column: Existing Users List */}
        <section className="xl:col-span-8 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Users size={18} className="text-blue-500" />
            <h2 className="font-bold text-slate-700 uppercase text-[11px] tracking-widest">
              System Directory
            </h2>
          </div>
          <div className="overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5">
            {/* The table now receives the full aliases array, 
               allowing the modal to show "previous aliases" 
            */}
            <UserManagementTable users={users || []} />
          </div>
        </section>
      </div>
    </div>
  );
}