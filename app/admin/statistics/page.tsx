"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminStatsTiles from "@/components/admin/AdminStatsTiles";
import { BarChart3, RefreshCcw, Search, Users } from "lucide-react";

export default function AdminStatisticsPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAllJobsForStats = async () => {
    setLoading(true);
    try {
      let allData: any[] = [];
      let from = 0;
      const PAGE_SIZE = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("jobs")
          .select(
            `
          id,
          actual_job_id,
          assigned_accessor_id,
          assessor:assigned_accessor_id!inner(username),
          checklist_items(id, item_description, target_role, is_completed)
        `,
          )
          // Filter: only items where target_role is assessor
          .eq("checklist_items.target_role", "assessor")
          // This !inner makes the filter happen at the DB level
          .not("assigned_accessor_id", "is", null)
          .range(from, from + PAGE_SIZE - 1);

        if (error) {
          console.error("Error:", error);
          break;
        }

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          from += PAGE_SIZE;
          if (data.length < PAGE_SIZE) hasMore = false;
        } else {
          hasMore = false;
        }
      }

      // FINAL DEDUPLICATION (The "Safety Net")
      // This ensures that even if the join creates duplicates, we only keep one per ID
      const uniqueMap = new Map();
      allData.forEach((job) => uniqueMap.set(job.id, job));

      const finalJobs = Array.from(uniqueMap.values());
      console.log(`Total unique assessor jobs: ${finalJobs.length}`); // Should now be 695

      setJobs(finalJobs);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAllJobsForStats();
  }, []);

  // Filter based on search query, focusing ONLY on Assessor names
  const filteredJobs = jobs.filter((job) => {
    const searchLower = searchQuery.toLowerCase();
    const assessorName = job.assessor?.username?.toLowerCase() || "";
    return assessorName.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-slate-400 uppercase tracking-[0.3em] text-xs">
          Filtering Assessor Data...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">
            Assessor Statistics
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Tracking {jobs.length} active assessor assignments.
          </p>
        </div>

        <button
          onClick={fetchAllJobsForStats}
          className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm group"
        >
          <RefreshCcw
            size={16}
            className="text-slate-400 group-hover:rotate-180 transition-transform duration-500"
          />
          <span className="text-xs font-black uppercase tracking-widest text-slate-700">
            Refresh
          </span>
        </button>
      </div>

      <hr className="border-slate-200" />

      {/* FILTER BAR */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-black"
          size={18}
        />
        <input
          type="text"
          placeholder="Search Assessor Username..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 text-black rounded-3xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* TILES COMPONENT */}
      {/* Ensure your AdminStatsTiles component also filters internal loops for "Assessor" role */}
      <AdminStatsTiles jobs={filteredJobs} />

      {/* EMPTY STATE */}
      {filteredJobs.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
          <Users size={40} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">
            No assessors found matching {searchQuery}
          </p>
        </div>
      )}
    </div>
  );
}
