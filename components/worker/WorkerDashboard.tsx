"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import * as XLSX from "xlsx"; // 1. Import XLSX
import {
  MapPin,
  Phone,
  Calendar,
  ClipboardList,
  Briefcase,
  CheckCircleIcon,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  LayoutGrid,
  Download,
} from "lucide-react";

export default function WorkerDashboard({
  userId,
  userRole,
}: {
  userId: string;
  userRole: string[];
}) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Pending"); // Pending/Completed filter

  const supabase = createClient();

  const fetchWorkerJobs = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const filterStr = `assigned_accessor_id.eq.${userId},assigned_plumber_id.eq.${userId},assigned_elec_id.eq.${userId},assigned_agent_id.eq.${userId}`;

    const { data, error } = await supabase
      .from("jobs")
      .select(`*, checklist_items(*)`)
      .or(filterStr)
      .order("created_at", { ascending: false });

    if (!error) setJobs(data || []);
    setLoading(false);
  }, [userId, supabase]);

  useEffect(() => {
    fetchWorkerJobs();
  }, [fetchWorkerJobs]);

  const canSeeItem = useCallback(
    (targetRole: string) => {
      if (!targetRole) return false;
      const target = targetRole.toLowerCase();
      const normalizedUserRoles = userRole.map((r) => r.toLowerCase());
      if (normalizedUserRoles.includes("agent")) return true;
      if (target === "all") return true;
      return normalizedUserRoles.includes(target);
    },
    [userRole],
  ); // Ye sirf tab badlega jab userRole badlega
  // Combined Filtering Logic
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Search filter
      const matchesSearch =
        job.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.actual_job_id.toString().includes(searchQuery) ||
        job.customer_suburb.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Category filter
      const matchesCategory =
        selectedCategory === "All" || job.job_category === selectedCategory;

      // 3. Dynamic Status Filter (Fix yaha hai)
      // Hum sirf wo items filter kar rahe hain jo user dekh sakta hai
      const visibleTasksForUser =
        job.checklist_items?.filter((item: any) =>
          canSeeItem(item.target_role),
        ) || [];

      // Logic: Agar user ke kaam ka koi task nahi hai, toh Completed.
      // Agar aap chahte hain ke "saare tasks tick hone par" completed ho,
      // toh use karein: const isActuallyCompleted = visibleTasksForUser.length === 0 || visibleTasksForUser.every(t => t.is_completed);
      const isActuallyCompleted = visibleTasksForUser.length === 0;

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Completed"
          ? isActuallyCompleted
          : !isActuallyCompleted);

      return matchesSearch && matchesCategory && matchesStatus;
    });
    // Note: userRole yaha dependency mein hona chahiye kyunki canSeeItem uspar depend karta hai
  }, [jobs, searchQuery, selectedCategory, selectedStatus, canSeeItem]);

  const categories = useMemo(() => {
    const cats = jobs.map((j) => j.job_category);
    return ["All", ...Array.from(new Set(cats))];
  }, [jobs]);

  const exportToExcel = () => {
    // Prepare the data for Excel
    const dataToExport = filteredJobs.map((job) => {
      // 1. Sirf wahi tasks filter karein jo ye user dekh sakta hai
      const visibleTasks =
        job.checklist_items?.filter((item: any) =>
          canSeeItem(item.target_role),
        ) || [];

      // 2. Logic: Status wahi rakhein jo UI par dikh raha hai
      const isActuallyCompleted = visibleTasks.length === 0;
      const displayStatus = isActuallyCompleted ? "COMPLETED" : "PENDING";

      // 3. Checklist summary mein bhi sirf role-specific tasks dikhayein
      const checklistSummary = visibleTasks
        .map((item: any) => `${item.item_description}`)
        .join(" | ");

      return {
        "Job ID": job.actual_job_id,
        "Customer Name": job.customer_name,
        Status: displayStatus, // Sync with UI logic
        Category: job.job_category,
        Suburb: job.customer_suburb,
        Address: job.customer_address,
        Phone: job.customer_phone,
        "Phone Audit": job.phone_audit,
        "My Role Tasks": checklistSummary || "No tasks for my role",
      };
    });

    // Create Worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Header styling (Optional: column widths)
    worksheet["!cols"] = [
      { wch: 15 }, // Job ID
      { wch: 25 }, // Customer Name
      { wch: 15 }, // Status
      { wch: 20 }, // Category
      { wch: 20 }, // Suburb
      { wch: 40 }, // Address
      { wch: 15 }, // Phone
      { wch: 15 }, // Phone Audit
      { wch: 50 }, // Checklist Summary
    ];

    // Create Workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Jobs");

    // Generate Buffer and Download
    XLSX.writeFile(
      workbook,
      `Jobs_Export_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-black">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
          Syncing Tasks...
        </p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
            My Assignments
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Showing {filteredJobs.length} of {jobs.length} Jobs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* 4. ADDED EXPORT BUTTON */}
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-2xl transition-all shadow-sm active:scale-95"
          >
            <Download size={14} className="text-blue-600" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Export Excel
            </span>
          </button>

          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl">
            <Briefcase size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {userRole.join(" • ")}
            </span>
          </div>
        </div>
      </header>

      {/* --- SEARCH & FILTERS SECTION --- */}
      <div className="space-y-3 mb-8">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search customer, Suburb or job ID..."
            className="w-full pl-12 pr-4 py-4 text-black bg-white border border-slate-200 rounded-[1.25rem] text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <select
              className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-700 focus:outline-none appearance-none cursor-pointer shadow-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <LayoutGrid
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={14}
            />
            <select
              className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-700 focus:outline-none appearance-none cursor-pointer shadow-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
          <ClipboardList size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">
            No matching jobs found
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const isExpanded = expandedJobId === job.id;
            // New Logic: Completed if no checklist items, otherwise Pending
            // 1. Pehle tasks ko filter karo user ke role ke basis par (same logic jo UI mein niche use ho raha hai)
            const visibleTasks =
              job.checklist_items?.filter((item: any) =>
                canSeeItem(item.target_role),
              ) || [];

            // 2. Ab check karo ke kya user ko dikhne waale tasks empty hain?
            const hasNoTasksForMe = visibleTasks.length === 0;

            // 3. Status tabhi completed dikhao jab user ke matlab ka koi task na ho
            const isCompleted = hasNoTasksForMe;

            return (
              <div
                key={job.id}
                className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                  isExpanded
                    ? "border-blue-500 shadow-xl ring-4 ring-blue-50"
                    : "border-slate-200 hover:border-slate-300 shadow-sm"
                }`}
              >
                {/* --- COLLAPSED HEADER --- */}
                <button
                  onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  className="w-full flex items-center justify-between px-3 sm:px-6 py-4 sm:py-5 text-left transition-colors hover:bg-slate-50"
                >
                  {/* Left Section: ID and Info */}
                  <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <span className="shrink-0 text-[9px] sm:text-[10px] font-black bg-slate-100 text-slate-600 px-2 sm:px-3 py-1 rounded-lg tracking-widest border border-slate-200">
                      {job.actual_job_id.toString().toUpperCase()}
                    </span>

                    <div className="min-w-0">
                      <h2
                        className={`text-xs sm:text-sm font-black uppercase tracking-tight truncate ${
                          isCompleted ? "text-slate-400" : "text-slate-800"
                        }`}
                      >
                        {job.customer_name}
                      </h2>
                      <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-wider truncate">
                        {job.job_category} <span className="mx-1">•</span>{" "}
                        {job.customer_suburb}
                      </p>
                    </div>
                  </div>

                  {/* Right Section: Status and Icon */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
                    <span
                      className={`inline-block text-[8px] sm:text-[9px] font-black uppercase px-2 sm:px-3 py-1 rounded-full border ${
                        isCompleted
                          ? "bg-green-50 text-green-600 border-green-100"
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      }`}
                    >
                      {isCompleted ? "Completed" : "Pending"}
                    </span>

                    <div className="shrink-0">
                      {isExpanded ? (
                        <ChevronUp size={18} className="text-blue-600" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* --- EXPANDED CONTENT --- */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <div className="px-6 pb-6 pt-2 border-t border-slate-50">
                      <div className="grid md:grid-cols-2 gap-6 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                        {/* Details */}
                        <div className="space-y-4 text-slate-700">
                          <div className="flex items-start gap-3">
                            <MapPin
                              size={16}
                              className="text-blue-500 mt-1 shrink-0"
                            />
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Address
                              </p>
                              <p className="text-xs font-bold leading-relaxed">
                                {job.customer_address}, {job.customer_suburb}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <Phone
                              size={16}
                              className="text-green-500 mt-1 shrink-0"
                            />
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Contact
                              </p>
                              <a
                                href={`tel:${job.customer_phone}`}
                                className="text-xs font-bold text-blue-600 underline"
                              >
                                {job.customer_phone}
                              </a>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Phone Audit
                              </p>
                              <p className="text-xs font-bold mt-1.5">
                                {job.phone_audit}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Checklist */}
                        <div className="space-y-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Checklist Tasks
                          </p>
                          <div className="grid gap-2">
                            {job.checklist_items
                              ?.filter((item: any) =>
                                canSeeItem(item.target_role),
                              )
                              .map((item: any) => (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm"
                                >
                                  {item.is_completed ? (
                                    <CheckCircleIcon
                                      size={16}
                                      className="text-green-500 shrink-0"
                                    />
                                  ) : (
                                    <X
                                      size={16}
                                      className="text-red-300 shrink-0"
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p
                                      className={`text-[10px] font-bold ${item.is_completed ? "line-through text-slate-400" : "text-slate-700"}`}
                                    >
                                      {item.item_description}
                                    </p>
                                    <span className="text-[7px] font-black text-blue-400 uppercase">
                                      Role: {item.target_role}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
