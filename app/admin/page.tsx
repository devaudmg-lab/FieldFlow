"use client"; // Changed to client component to handle tab state

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client"; // Use client-side auth for interactivity
import BulkUploadZone from "@/components/admin/BulkUploadZone";
import JobManagementTable from "@/components/admin/JobManagementTable";
import {
  LayoutDashboard,
  Activity,
  ClipboardCheck,
  Users,
  Zap,
  Droplets,
  Sun,
} from "lucide-react";
import { Database } from "@/types/database";


type JobWithRelations = Database["public"]["Tables"]["jobs"]["Row"] & {
  assessor: { username: string } | null;
  plumber: { username: string } | null;
  electrician: { username: string } | null;
  agent: { username: string } | null;
  checklist_items: any[];
};

export default function AdminDashboard() {
  const supabase = createClient();

  // 1. State for Tabs
  const [activeJobCat, setActiveJobCat] = useState<"AC" | "HWS" | "Solar">(
    "AC",
  );
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Fetch jobs (Simplified to match your schema's 'username' field)
  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component

    // AdminDashboard.tsx ke andar fetchJobs function
    const fetchJobs = async () => {
      setLoading(true);
      const allJobsMap = new Map();
      let from = 0;
      const step = 1000;
      let hasMore = true;

      try {
        while (hasMore) {
          // Range logic: (0 to 999), (1000 to 1999), etc.
          const to = from + step - 1;

          const { data, error, count } = await supabase
            .from("jobs")
            .select(
              `
          *,
          assessor:assigned_accessor_id(username),
          plumber:assigned_plumber_id(username),
          electrician:assigned_elec_id(username),
          agent:assigned_agent_id(username),
          checklist_items(id, item_description, target_role, is_completed)
        `,
              { count: "exact" },
            ) // 'exact' se total records ka pata chalta hai
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .range(from, to);

          if (error) throw error;

          if (data && data.length > 0) {
            
            // Data ko Map mein store karein (ID as Key)
            const typedData = data as unknown as JobWithRelations[];
            typedData.forEach((job) => allJobsMap.set(job.id, job));

            console.log(
              `Fetched ${from} to ${to}. Current total: ${allJobsMap.size}`,
            );

            // Agar humne total count touch kar liya ya data khatam ho gaya
            if (allJobsMap.size >= (count || 0) || data.length < step) {
              hasMore = false;
            } else {
              from += step;
            }
          } else {
            hasMore = false;
          }
        }
      } catch (err) {
        console.error(">>> [FETCH ERROR]:", err);
      } finally {
        setJobs(Array.from(allJobsMap.values()));
        setLoading(false);
      }
    };

    fetchJobs();
    return () => {
      isMounted = false;
    }; // Cleanup function
  }, []);

  const totalJobs = jobs.length;
  const pendingJobs = jobs.filter((j) => j.status === "pending").length;
  const completedJobs = jobs.filter((j) => j.status === "completed").length;

  return (
    <div className="space-y-8 p-4 md:p-8 bg-slate-50/50 min-h-screen">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            System Control
          </h1>
          <p className="text-slate-500 mt-1">
            Manage infrastructure deployments and team assignments.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 ">
          <StatCard
            label="Total"
            value={totalJobs}
            icon={<LayoutDashboard size={16} />}
            color="bg-slate-100 text-slate-600"
          />
          <StatCard
            label="Pending"
            value={pendingJobs}
            icon={<Activity size={16} />}
            color="bg-amber-100 text-amber-600"
          />
          <StatCard
            label="Done"
            value={completedJobs}
            icon={<ClipboardCheck size={16} />}
            color="bg-green-100 text-green-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Upload & Configuration Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* 1. Job Category Tabs */}
          <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
            <label className="text-[10px] font-bold text-slate-400 uppercase px-2 mb-2 block">
              Job Category
            </label>
            <div className="grid grid-cols-3 gap-1">
              <TabButton
                active={activeJobCat === "AC"}
                onClick={() => setActiveJobCat("AC")}
                icon={<Zap size={14} />}
                label="AC"
              />
              <TabButton
                active={activeJobCat === "HWS"}
                onClick={() => setActiveJobCat("HWS")}
                icon={<Droplets size={14} />}
                label="HWS"
              />
              <TabButton
                active={activeJobCat === "Solar"}
                onClick={() => setActiveJobCat("Solar")}
                icon={<Sun size={14} />}
                label="Solar"
              />
            </div>
          </div>

          {/* 3. Bulk Upload Zone (Passing metadata to component) */}
          <div className="sticky top-8">
            <BulkUploadZone jobCategory={activeJobCat} />

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-2 mb-2 text-blue-800 font-semibold text-sm">
                <Users size={16} />
                <h3>Upload Context</h3>
              </div>
              <p className="text-xs text-blue-600 leading-relaxed">
                Currently uploading for{" "}
                <span className="font-bold">{activeJobCat}</span>
                Aliases will be mapped to active profiles automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Live Job Monitor */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Active Job Monitor
            </h2>
          </div>
          <div className="p-0">
            <JobManagementTable initialJobs={jobs} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all
        ${
          active
            ? "bg-slate-900 text-white shadow-md"
            : "bg-transparent text-slate-500 hover:bg-slate-100"
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3 rounded-xl border border-slate-200 bg-white shadow-sm min-w-[120px]">
      <div className={`p-2.5 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-[10px] uppercase font-black text-slate-400 leading-none mb-1">
          {label}
        </p>
        <p className="text-xl font-bold text-slate-900 leading-none">{value}</p>
      </div>
    </div>
  );
}
