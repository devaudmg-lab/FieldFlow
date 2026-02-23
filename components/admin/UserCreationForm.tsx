"use client";

import { useState, useEffect } from "react";
import { createNewUser } from "@/lib/actions/admin";
import { getCompanies } from "@/lib/actions/companies"; // Import the real action
import {
  Plus,
  Trash2,
  Star,
  UserPlus,
  Shield,
  KeyRound,
  Mail,
  User as UserIcon,
  Building2,
} from "lucide-react";

const AVAILABLE_ROLES = ["admin", "assessor", "worker", "agent"] as const;

interface AliasInput {
  name: string;
  is_primary: boolean; // Renamed to match DB schema
}

export default function UserCreationForm() {
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<
    (typeof AVAILABLE_ROLES)[number][]
  >(["worker"]);
  const [aliases, setAliases] = useState<AliasInput[]>([
    { name: "", is_primary: true },
  ]);

  // --- Company States ---
  const [isNewCompany, setIsNewCompany] = useState(true);
  const [companyInput, setCompanyInput] = useState("");
  const [existingCompanies, setExistingCompanies] = useState<
    { id: string; name: string }[]
  >([]);

  const isAgentSelected = selectedRoles.includes("agent");

  // Fetch real companies from the database
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const data = await getCompanies();
        setExistingCompanies(data);
      } catch (err) {
        console.error("Failed to load companies", err);
      }
    }
    fetchCompanies();
  }, []);

  // --- Role Selection Logic ---
  const toggleRole = (role: (typeof AVAILABLE_ROLES)[number]) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  // --- Alias Management Logic ---
  const addAlias = () => {
    setAliases([...aliases, { name: "", is_primary: false }]);
  };

  const removeAlias = (index: number) => {
    if (aliases.length === 1) return;
    const newAliases = [...aliases];
    const removedWasPrimary = newAliases[index].is_primary;
    newAliases.splice(index, 1);
    if (removedWasPrimary) newAliases[0].is_primary = true;
    setAliases(newAliases);
  };

  const updateAliasName = (index: number, name: string) => {
    const newAliases = [...aliases];
    newAliases[index].name = name;
    setAliases(newAliases);
  };

  const setPrimary = (index: number) => {
    const newAliases = aliases.map((a, i) => ({
      ...a,
      is_primary: i === index,
    }));
    setAliases(newAliases);
  };

  // --- Form Submission ---
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (selectedRoles.length === 0)
      return alert("Please select at least one role.");
    if (aliases.some((a) => !a.name.trim()))
      return alert("Please fill in all alias names.");

    if (isAgentSelected && !companyInput.trim()) {
      return alert("Please provide a company name or select an existing one.");
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const result = await createNewUser({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      username: formData.get("username") as string,
      roles: selectedRoles as any, // Cast to match strict role types
      is_active: true,
      aliases: aliases,
      companyData: isAgentSelected
        ? {
            name: isNewCompany ? companyInput : null,
            id: !isNewCompany ? companyInput : null,
          }
        : null,
    });

    if (result.error) {
      alert(`Error: ${result.error}`);
      setLoading(false);
    } else {
      alert("Success! User, Profile, and Aliases created.");
      (e.target as HTMLFormElement).reset();
      setAliases([{ name: "", is_primary: true }]);
      setSelectedRoles(["worker"]);
      setCompanyInput("");
      setLoading(false);

      // Refresh company list in case a new one was created
      const data = await getCompanies();
      setExistingCompanies(data);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl mx-auto pb-20">
      {/* 1. AUTHENTICATION SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800 border-b pb-2">
          <KeyRound size={18} className="text-blue-600" />
          <h3 className="font-semibold uppercase text-xs tracking-wider">
            Auth Credentials
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3 text-slate-400"
                size={16}
              />
              <input
                name="email"
                type="email"
                required
                placeholder="email@company.com"
                className="w-full pl-10 p-2.5 border rounded-lg text-black bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Login Password
            </label>
            <div className="relative">
              <KeyRound
                className="absolute left-3 top-3 text-slate-400"
                size={16}
              />
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="w-full pl-10 p-2.5 border rounded-lg text-black bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROFILE & ROLES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800 border-b pb-2">
          <Shield size={18} className="text-blue-600" />
          <h3 className="font-semibold uppercase text-xs tracking-wider">
            Profile & Permissions
          </h3>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">
            System Username
          </label>
          <div className="relative">
            <UserIcon
              className="absolute left-3 top-3 text-slate-400"
              size={16}
            />
            <input
              name="username"
              required
              placeholder="j.doe_99"
              className="w-full pl-10 p-2.5 border rounded-lg text-black bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Assigned Roles
          </label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => toggleRole(role)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  selectedRoles.includes(role)
                    ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300"
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2.5 AGENT/COMPANY SECTION */}
      {isAgentSelected && (
        <div className="space-y-4 p-5 bg-blue-50/50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <Building2 size={18} />
              <h3 className="font-semibold uppercase text-xs tracking-wider">
                Company Assignment
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsNewCompany(!isNewCompany);
                setCompanyInput("");
              }}
              className="text-[10px] font-bold bg-white border border-blue-200 px-2 py-1 rounded-md text-blue-600 hover:bg-blue-100 transition shadow-sm"
            >
              {isNewCompany ? "LINK EXISTING" : "REGISTER NEW"}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              {isNewCompany ? "Create New Company" : "Select from Records"}
            </label>

            {isNewCompany ? (
              <input
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                placeholder="Enter company name..."
                className="w-full p-2.5 border border-blue-200 rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            ) : (
              <select
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                className="w-full p-2.5 border border-blue-200 rounded-lg text-black bg-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                required
              >
                <option value="">-- Select Existing Company --</option>
                {existingCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* 3. ALIASES SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex items-center gap-2 text-slate-800">
            <UserPlus size={18} className="text-blue-600" />
            <h3 className="font-semibold uppercase text-xs tracking-wider">
              Known Names (Aliases)
            </h3>
          </div>
          <button
            type="button"
            onClick={addAlias}
            className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition"
          >
            <Plus size={14} /> Add Alias
          </button>
        </div>

        <div className="space-y-3">
          {aliases.map((alias, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row items-center gap-3 animate-in fade-in zoom-in-95 duration-200"
            >
              <input
                value={alias.name}
                onChange={(e) => updateAliasName(index, e.target.value)}
                placeholder="Full Name / Display Name"
                className="flex-1 p-2.5 border rounded-lg text-black bg-white outline-none focus:border-blue-500 shadow-sm w-full"
                required
              />
              <div className="w-full sm:w-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setPrimary(index)}
                  className={`p-2.5 rounded-lg border transition-all flex-1 sm:flex-none ${
                    alias.is_primary
                      ? "bg-amber-500 border-amber-500 text-white shadow-md"
                      : "bg-white border-slate-200 text-slate-400 hover:text-amber-500"
                  }`}
                >
                  <Star
                    size={18}
                    fill={alias.is_primary ? "currentColor" : "none"}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => removeAlias(index)}
                  disabled={aliases.length === 1}
                  className="p-2.5 text-slate-400 hover:text-red-500 transition disabled:opacity-30 flex-1 sm:flex-none"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl active:scale-[0.98]"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            Initializing Account...
          </span>
        ) : (
          <>
            <UserPlus size={20} />
            Initialize User Account
          </>
        )}
      </button>
    </form>
  );
}
