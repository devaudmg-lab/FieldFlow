"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOutButton({
  variant = "full",
}: {
  variant?: "full" | "icon";
}) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  };

  if (variant === "icon") {
    return (
      <button
        onClick={handleSignOut}
        className="text-red-500 hover:scale-110 transition-transform"
      >
        <LogOut size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-xl transition-all"
    >
      <LogOut size={14} />
      Logout
    </button>
  );
}
