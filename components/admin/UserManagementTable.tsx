"use client";

import { useState, useEffect } from "react";
import { deleteUser, updateUser } from "@/lib/actions/admin";
import { getCompanies } from "@/lib/actions/companies";
import {
  Trash2,
  UserCog,
  UserCheck,
  UserMinus,
  X,
  Save,
  Plus,
  Loader2,
  Building2,
  Star,
} from "lucide-react";
import { Database } from "@/types/database";

type RoleType =
  Database["public"]["Tables"]["profiles"]["Row"]["roles"][number];

interface UserProfile {
  id: string;
  username: string;
  roles: RoleType[];
  is_active: boolean;
  company_id: string | null;
  profile_aliases: { alias_name: string; is_primary: boolean }[];
}

const ROLE_OPTIONS: RoleType[] = ["admin", "assessor", "worker", "agent"];

export default function UserManagementTable({
  users,
}: {
  users: UserProfile[];
}) {
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Company States for Edit Modal
  const [existingCompanies, setExistingCompanies] = useState<
    { id: string; name: string }[]
  >([]);
  const [isNewCompany, setIsNewCompany] = useState(false);
  const [companyInput, setCompanyInput] = useState("");

  const [editForm, setEditForm] = useState({
    username: "",
    roles: [] as RoleType[],
    is_active: true,
    aliases: [] as { name: string; is_primary: boolean }[],
  });

  const isAgentSelected = editForm.roles.includes("agent");

  // Load companies for the dropdown
  useEffect(() => {
    getCompanies().then(setExistingCompanies).catch(console.error);
  }, []);

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setIsNewCompany(false);
    setCompanyInput(user.company_id || "");
    setEditForm({
      username: user.username,
      roles: user.roles,
      is_active: user.is_active,
      aliases: user.profile_aliases.map((a) => ({
        name: a.alias_name,
        is_primary: a.is_primary,
      })),
    });
  };

  const handleSave = async () => {
    if (!editingUser) return;

    if (isAgentSelected && !companyInput.trim()) {
      return alert("Agents must be assigned to a company.");
    }

    setIsSaving(true);

    const result = await updateUser(editingUser.id, {
      ...editForm,
      companyData: isAgentSelected
        ? {
            id: !isNewCompany ? companyInput : null,
            name: isNewCompany ? companyInput : null,
          }
        : null,
    });

    setIsSaving(false);
    if (result?.error) {
      alert(result.error);
    } else {
      setEditingUser(null);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (
      confirm(`Permanently delete ${user.username}? This cannot be undone.`)
    ) {
      const result = await deleteUser(user.id);
      if (result?.error) alert(result.error);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">
                Staff Member
              </th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">
                Roles
              </th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase">
                Status
              </th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr
                key={user.id}
                className="group hover:bg-slate-50/50 transition-colors"
              >
                <td className="p-4">
                  <div className="font-semibold text-slate-900">
                    {user.profile_aliases.find((a) => a.is_primary)
                      ?.alias_name || user.username}
                  </div>
                  <div className="text-xs text-slate-500">@{user.username}</div>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((r) => (
                      <span
                        key={r}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-sm">
                  {user.is_active ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <UserCheck size={14} /> Active
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <UserMinus size={14} /> Inactive
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <UserCog size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- EDIT MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center text-black bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Edit Staff Profile
                </h2>
                <p className="text-xs text-slate-500">
                  Update system roles, company, and display aliases
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Username & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    className="w-full p-2.5 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-blue-500/20"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </label>
                  <button
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        is_active: !editForm.is_active,
                      })
                    }
                    className={`w-full p-2.5 border rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${editForm.is_active ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
                  >
                    {editForm.is_active ? (
                      <>
                        <UserCheck size={16} /> Active
                      </>
                    ) : (
                      <>
                        <UserMinus size={16} /> Inactive
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Roles */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Permissions
                </label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((role) => {
                    const active = editForm.roles.includes(role);
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          const roles = active
                            ? editForm.roles.filter((r) => r !== role)
                            : [...editForm.roles, role];
                          setEditForm({ ...editForm, roles });
                        }}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition-all ${active ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" : "bg-white border-slate-200 text-slate-400"}`}
                      >
                        {role.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Conditional Company Selection */}
              {isAgentSelected && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-blue-500 uppercase flex items-center gap-2">
                      <Building2 size={14} /> Company Assignment
                    </label>
                    <button
                      onClick={() => {
                        setIsNewCompany(!isNewCompany);
                        setCompanyInput("");
                      }}
                      className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 border rounded hover:bg-blue-100"
                    >
                      {isNewCompany ? "EXISTING" : "REGISTER NEW"}
                    </button>
                  </div>
                  {isNewCompany ? (
                    <input
                      placeholder="New Company Name"
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm"
                    />
                  ) : (
                    <select
                      value={companyInput}
                      onChange={(e) => setCompanyInput(e.target.value)}
                      className="w-full p-2 border rounded-lg text-sm bg-white"
                    >
                      <option value="">-- Select Company --</option>
                      {existingCompanies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Aliases */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase">
                    Aliases
                  </label>
                  <button
                    onClick={() =>
                      setEditForm((p) => ({
                        ...p,
                        aliases: [
                          ...p.aliases,
                          { name: "", is_primary: p.aliases.length === 0 },
                        ],
                      }))
                    }
                    className="text-xs text-blue-600 flex items-center gap-1 font-bold"
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {editForm.aliases.map((alias, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200"
                    >
                      <input
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                        value={alias.name}
                        onChange={(e) => {
                          const next = [...editForm.aliases];
                          next[idx].name = e.target.value;
                          setEditForm({ ...editForm, aliases: next });
                        }}
                      />
                      <button
                        onClick={() =>
                          setEditForm((p) => ({
                            ...p,
                            aliases: p.aliases.map((a, i) => ({
                              ...a,
                              is_primary: i === idx,
                            })),
                          }))
                        }
                        className={`p-1.5 rounded-md transition-all ${alias.is_primary ? "text-amber-500" : "text-slate-300"}`}
                      >
                        <Star
                          size={16}
                          fill={alias.is_primary ? "currentColor" : "none"}
                        />
                      </button>
                      <button
                        onClick={() =>
                          setEditForm((p) => ({
                            ...p,
                            aliases: p.aliases.filter((_, i) => i !== idx),
                          }))
                        }
                        className="p-1.5 text-slate-300 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
              <button
                disabled={isSaving}
                onClick={() => setEditingUser(null)}
                className="px-5 py-2 text-sm font-bold text-slate-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={handleSave}
                className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-2 shadow-lg disabled:opacity-70"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
