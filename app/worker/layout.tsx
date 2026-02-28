import React from "react";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Briefcase,
  UserCircle,
  Bell,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import SignOutButton from "@/components/auth/SignOutButton"; // Adjust path as needed
import { Database } from "@/types/database";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Session check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // 2. Profile details
const { data: profileData } = await supabase
    .from("profiles")
    .select("username, roles")
    .eq("id", user.id)
    .single();

    const profile = profileData as unknown as ProfileRow;
    

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex w-72 flex-col bg-slate-900 text-white sticky top-0 h-screen shadow-2xl">
        <div className="p-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <CheckCircle size={24} className="text-white" />
            </div>
            <div>
              <h2 className="font-black text-xl tracking-tighter uppercase leading-none">
                Field<span className="text-blue-500">Flow</span>
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-blue-400">
                Worker Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <SidebarLink
            href="/worker"
            icon={<Briefcase size={20} />}
            label="My Assignments"
          />
          <SidebarLink
            href="/worker/profile"
            icon={<UserCircle size={20} />}
            label="Account Details"
          />
        </nav>

        {/* User Card & Sign Out at bottom of sidebar */}
        <div className="p-6 bg-slate-950/50 border-t border-slate-800/50 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-black shrink-0">
              {profile?.username?.substring(0, 2).toUpperCase() || "W"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate uppercase tracking-tight">
                {profile?.username || "Worker"}
              </p>
              <p className="text-[9px] text-slate-500 font-black uppercase truncate">
                {Array.isArray(profile?.roles)
                  ? profile.roles.join(" & ")
                  : profile?.roles}
              </p>
            </div>
          </div>

          {/* Desktop SignOut Button - Replaced the old form */}
          <div className="pt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-50">
          <h2 className="font-black text-slate-900 uppercase text-sm tracking-tighter">
            Field<span className="text-blue-600">Flow</span>
          </h2>
          <div className="flex items-center gap-4">
            <Bell size={20} className="text-slate-400" />
            {/* Mobile SignOut Icon Button logic - keeping it minimal */}
            <SignOutButton variant="icon" />
          </div>
        </header>

        {/* Desktop Top Nav (Right side) */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-end px-10 sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              System Live
            </div>
          </div>
        </header>

        <div className="flex-1 pb-24 md:pb-10 overflow-x-hidden">
          {children}
        </div>
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-8 py-3 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <MobileNavLink
          href="/worker"
          icon={<Briefcase size={22} />}
          label="Jobs"
        />
        <MobileNavLink
          href="/worker/profile"
          icon={<UserCircle size={22} />}
          label="Profile"
        />
      </nav>
    </div>
  );
}

// Helper: Desktop Nav Link
function SidebarLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      }`}
    >
      {icon}
      <span className="tracking-tight">{label}</span>
    </Link>
  );
}

// Helper: Mobile Nav Link
function MobileNavLink({
  href,
  icon,
  label,
  active = false,
}: {
  href: string;
  icon: any;
  label: string;
  active?: boolean;
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-1 group">
      <div
        className={`${active ? "text-blue-600 scale-110" : "text-slate-400"} transition-all`}
      >
        {icon}
      </div>
      <span
        className={`text-[9px] font-black uppercase tracking-widest ${active ? "text-blue-600" : "text-slate-400"}`}
      >
        {label}
      </span>
    </Link>
  );
}
