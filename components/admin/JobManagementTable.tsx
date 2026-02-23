"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Trash2,
  CheckCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  AlertCircle,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Database } from "@/types/database";

interface Props {
  initialJobs: any[];
}

type ChecklistUpdate = Database["public"]["Tables"]["checklist_items"]["Update"];

export default function JobManagementTable({ initialJobs }: Props) {
  const [jobs, setJobs] = useState(initialJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "completed" | "pending"
  >("all");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(100);

  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const uniqueJobs = Array.from(
      new Map(initialJobs.map((item) => [item.id, item])).values(),
    );
    setJobs(uniqueJobs);
  }, [initialJobs]);

  // Reset page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, itemsPerPage]);

  // --- SEARCH & FILTER LOGIC ---
  const filteredJobs = React.useMemo(() => {
    return jobs.filter((job) => {
      const searchLower = searchTerm.toLowerCase().trim();

      // 1. Basic Search Matches
      const matchesID = job.id.toLowerCase() === searchLower;
      const matchesName = job.customer_name.toLowerCase().includes(searchLower);

      // 2. Username Search Matches (New)
      // We use optional chaining (?.) because these fields might be null
      const matchesAssessor = job.assessor?.username
        ?.toLowerCase()
        .includes(searchLower);
      const matchesPlumber = job.plumber?.username
        ?.toLowerCase()
        .includes(searchLower);
      const matchesElectrician = job.electrician?.username
        ?.toLowerCase()
        .includes(searchLower);
      const matchesAgent = job.agent?.username
        ?.toLowerCase()
        .includes(searchLower);

      const matchesSearch =
        searchTerm === "" ||
        matchesName ||
        matchesID ||
        matchesAssessor ||
        matchesPlumber ||
        matchesElectrician ||
        matchesAgent;

      // 3. Status Logic
      const total = job.checklist_items?.length || 0;
      const completed =
        job.checklist_items?.filter((i: any) => i.is_completed).length || 0;
      const isJobDone =
        (total === 0) ||
        (total > 0 && total === completed);

      // 4. Combine Filters
      if (filterStatus === "completed") return matchesSearch && isJobDone;
      if (filterStatus === "pending") return matchesSearch && !isJobDone;

      return matchesSearch;
    });
  }, [jobs, searchTerm, filterStatus]);

  // --- PAGINATION CALCULATION ---
  const paginatedJobs = React.useMemo(() => {
    if (itemsPerPage === "all") return filteredJobs;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredJobs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredJobs, currentPage, itemsPerPage]);

  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(filteredJobs.length / itemsPerPage);

  const toggleSelectAll = () => {
    if (
      selectedJobIds.length === paginatedJobs.length &&
      paginatedJobs.length > 0
    ) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(paginatedJobs.map((j) => j.id));
    }
  };

  const toggleSelectJob = (id: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const deleteJobs = async (ids: string[]) => {
    const message =
      ids.length === 1 ? "Are you sure?" : `Delete ${ids.length} jobs?`;
    if (!confirm(message)) return;
    setIsDeletingBulk(true);
    const { error } = await supabase.from("jobs").delete().in("id", ids);
    if (!error) {
      setJobs(jobs.filter((j) => !ids.includes(j.id)));
      setSelectedJobIds([]);
    }
    setIsDeletingBulk(false);
  };

const toggleItem = async (
  jobId: string,
  itemId: string,
  currentState: boolean,
) => {
  setIsUpdating(itemId);

  // 1. Prepare the typed payload


  // 2. Perform the update with a cast if necessary
const { error } = await (supabase
    .from("checklist_items") as any) // Force the table selection to pass
    .update({ 
      is_completed: !currentState 
    })
    .eq("id", itemId);

  if (!error) {
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId
          ? {
              ...job,
              checklist_items: job.checklist_items.map((item: any) =>
                item.id === itemId
                  ? { ...item, is_completed: !currentState }
                  : item,
              ),
            }
          : job,
      ),
    );
  }
  setIsUpdating(null);
};

  return (
    <div className="space-y-4">
      {/* --- TOP BAR --- */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full text-black pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
          {selectedJobIds.length > 0 && (
            <button
              onClick={() => deleteJobs(selectedJobIds)}
              disabled={isDeletingBulk}
              className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-black border border-red-100 hover:bg-red-600 hover:text-white transition-all"
            >
              {isDeletingBulk ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
              Delete ({selectedJobIds.length})
            </button>
          )}

          {/* Items Per Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase">
              Show:
            </span>
            <select
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none"
              value={itemsPerPage}
              onChange={(e) =>
                setItemsPerPage(
                  e.target.value === "all" ? "all" : Number(e.target.value),
                )
              }
            >
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
              <option value="all">All</option>
            </select>
          </div>

          <select
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-100">
              <th className="px-6 py-4 w-10">
                <button
                  onClick={toggleSelectAll}
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {selectedJobIds.length === paginatedJobs.length &&
                  paginatedJobs.length > 0 ? (
                    <CheckSquare size={20} className="text-blue-600" />
                  ) : (
                    <Square size={20} />
                  )}
                </button>
              </th>
              <th className="px-4 py-4 font-black w-12 text-center">#</th>
              <th className="px-6 py-4 font-black">Project & Client</th>
              <th className="px-6 py-4 font-black">Phone Audit</th>

              <th className="px-4 py-4 font-black">Assessor</th>
              <th className="px-4 py-4 font-black">Plumber</th>
              <th className="px-4 py-4 font-black">Electrician</th>
              <th className="px-4 py-4 font-black">Agent</th>

              <th className="px-6 py-4 font-black text-center">Progress</th>
              <th className="px-6 py-4 font-black text-center">Status</th>
              <th className="px-6 py-4 font-black text-right pr-8">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-sm">
            {paginatedJobs.length > 0 ? (
              paginatedJobs.map((job) => {
                const total = job.checklist_items?.length || 0;
                const completed =
                  job.checklist_items?.filter((i: any) => i.is_completed)
                    .length || 0;
                const isAutoVerified = total === 0;
                const percentage = isAutoVerified
                  ? 100
                  : (completed / total) * 100;
                const isFullyComplete = percentage === 100;
                const isExpanded = expandedJobId === job.id;
                const isSelected = selectedJobIds.includes(job.id);

                return (
                  <React.Fragment key={job.id}>
                    <tr
                      className={`group transition-all ${isSelected ? "bg-blue-50/60" : isExpanded ? "bg-slate-50" : "hover:bg-slate-50/80"}`}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleSelectJob(job.id)}
                          className={`transition-colors ${isSelected ? "text-blue-600" : "text-slate-300 group-hover:text-slate-400"}`}
                        >
                          {isSelected ? (
                            <CheckSquare size={20} />
                          ) : (
                            <Square size={20} />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {total > 0 ? (
                          <button
                            onClick={() =>
                              setExpandedJobId(isExpanded ? null : job.id)
                            }
                            className={`p-1.5 rounded-lg border transition-all ${isExpanded ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200" : "bg-white border-slate-200 text-slate-400 hover:text-slate-600"}`}
                          >
                            {isExpanded ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            )}
                          </button>
                        ) : (
                          <div className="p-1.5 text-slate-300 flex justify-center">
                            <AlertCircle size={16} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-bold tracking-tight uppercase leading-tight">
                          {job.customer_name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">
                          REF: {job.id.split("-")[0]}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${job.phone_audit === "All Good" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}`}
                        >
                          {job.phone_audit || "N/A"}
                        </span>
                      </td>

                      {/* ... after Phone Audit cell ... */}

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                          <span className="text-xs text-slate-600 font-semibold truncate max-w-[80px]">
                            {job.assessor?.username || (
                              <span className="text-slate-300 font-normal italic">
                                Not Provided
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                          <span className="text-xs text-slate-600 font-semibold truncate max-w-[80px]">
                            {job.plumber?.username || (
                              <span className="text-slate-300 font-normal italic">
                                Not Provided
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                          <span className="text-xs text-slate-600 font-semibold truncate max-w-[80px]">
                            {job.electrician?.username || (
                              <span className="text-slate-300 font-normal italic">
                                Not Provided
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                          <span className="text-xs text-slate-600 font-semibold truncate max-w-[80px]">
                            {job.agent?.username || (
                              <span className="text-slate-300 font-normal italic">
                                Not Provided
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* ... before Progress cell ... */}

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                            <div
                              className={`h-full transition-all duration-1000 ${isFullyComplete ? "bg-green-500" : "bg-blue-500"}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-400 mt-2 uppercase">
                            {isAutoVerified
                              ? "NO TASKS"
                              : `${completed} / ${total} DONE`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${isFullyComplete ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                        >
                          {isFullyComplete ? (
                            <CheckCircle size={10} />
                          ) : (
                            <Clock size={10} />
                          )}
                          {isFullyComplete ? "Completed" : "Pending"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right pr-8">
                        <button
                          onClick={() => deleteJobs([job.id])}
                          className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                    {isExpanded && total > 0 && (
                      <tr className="bg-slate-50/50">
                        <td
                          colSpan={11}
                          className="p-6 border-y border-slate-100"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {job.checklist_items?.map((item: any) => (
                              <div
                                key={item.id}
                                onClick={() =>
                                  toggleItem(job.id, item.id, item.is_completed)
                                }
                                className={`flex items-center justify-between p-4 rounded-xl border bg-white cursor-pointer hover:shadow-md transition-all ${item.is_completed ? "border-green-100 opacity-75" : "border-slate-200"}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-6 h-6 rounded border flex items-center justify-center ${item.is_completed ? "bg-green-500 border-green-500 text-white" : "border-slate-200 bg-slate-50"}`}
                                  >
                                    {isUpdating === item.id ? (
                                      <Loader2
                                        size={12}
                                        className="animate-spin"
                                      />
                                    ) : (
                                      item.is_completed && (
                                        <CheckCircle size={14} />
                                      )
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span
                                      className={`text-xs font-bold ${item.is_completed ? "text-slate-400 line-through" : "text-slate-800"}`}
                                    >
                                      {item.item_description}
                                    </span>
                                    <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                                      {item.target_role}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={11}
                  className="px-6 py-24 text-center text-slate-400 font-black uppercase text-xs"
                >
                  No matching jobs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINATION CONTROLS --- */}
      {itemsPerPage !== "all" && filteredJobs.length > itemsPerPage && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Showing{" "}
            <span className="text-slate-900">{paginatedJobs.length}</span> of{" "}
            <span className="text-slate-900">{filteredJobs.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="p-2 rounded-xl text-black border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${currentPage === pageNum ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "hover:bg-slate-100 text-slate-600"}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="p-2 rounded-xl border text-black border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
