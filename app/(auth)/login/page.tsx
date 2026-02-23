"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Lock, User, Loader2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const email = `${username}@fieldflow.com`;

    try {
      // 1. Supabase Auth Sign In
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      // Agar auth successful hai, toh loading true hi rehne denge
      // Taaki errorMsg flash na ho

      // 2. Profile Fetching
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("roles")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error("Profile not found. Contact administrator.");
      }

      // 3. Smart Redirect
      const roles = Array.isArray(profile.roles)
        ? profile.roles
        : [profile.roles];
      const normalizedRoles = roles.map((r: string) => r.toLowerCase());

      // Yahan redirect se pehle router.refresh() ki zarurat hai session sync ke liye
      router.refresh();

      if (normalizedRoles.includes("admin")) {
        window.location.href = "/admin";
        return; // <--- Critical: Yahan se function exit kar jayein
      }

      if (
        normalizedRoles.some((r: string) =>
          ["assessor", "agent", "worker"].includes(r),
        )
      ) {
        window.location.href = "/worker";
        return; // <--- Critical
      }

      throw new Error("Unauthorized role.");
    } catch (err: any) {
      // Sirf actual error ke case mein hi message dikhayenge
      console.error("Login error:", err);
      setErrorMsg(err.message || "Invalid credentials.");
      setLoading(false); // Stop loading ONLY on error
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      {/* ... (Baki UI same rahega) ... */}
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl text-white mb-4 shadow-xl">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Field<span className="text-blue-600">Flow</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2 uppercase tracking-[0.2em] text-[10px]">
            Enterprise Resource Portal
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-[10px] font-black text-center uppercase tracking-tighter">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Worker Identifier
              </label>
              <div className="relative group">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  required
                  className="w-full text-slate-900 pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-semibold placeholder:text-slate-300"
                  placeholder="e.g. jason_01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Security Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                  size={18}
                />
                <input
                  type="password"
                  required
                  className="w-full text-slate-900 pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all font-semibold placeholder:text-slate-300"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200 disabled:bg-slate-400"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span className="tracking-widest">AUTHENTICATING...</span>
                </>
              ) : (
                <span className="tracking-widest">SIGN IN TO SYSTEM</span>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-loose">
            Internal Use Only <br />© 2026 Infrastructure Management Group
          </p>
        </div>
      </div>
    </div>
  );
}
