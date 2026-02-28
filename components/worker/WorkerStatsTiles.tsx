"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  CheckCircle2,
  Hash,
  User,
} from "lucide-react";

interface WorkerStatsTilesProps {
  jobs: any[];
  userRole: string[];
  canSeeItem: (targetRole: string) => boolean;
}

export default function WorkerStatsTiles({
  jobs,
  canSeeItem,
}: WorkerStatsTilesProps) {
  // 1. Stats Calculation (Same logic, consistent data)
  const stats = useMemo(() => {
    let pendingCount = 0;
    let completedCount = 0;

    jobs.forEach((job) => {
      const visibleTasks =
        job.checklist_items?.filter((item: any) =>
          canSeeItem(item.target_role),
        ) || [];

      const isActuallyPending = visibleTasks.some((t: any) => !t.is_completed);

      if (visibleTasks.length > 0 && isActuallyPending) {
        pendingCount++;
      } else {
        completedCount++;
      }
    });

    return {
      total: jobs.length,
      pending: pendingCount,
      completed: completedCount,
    };
  }, [jobs, canSeeItem]);

  // 2. Grouping Only Pending Tasks for Accordions
  const groupedPending = useMemo(() => {
    const groups: Record<string, any[]> = {};

    jobs.forEach((job) => {
      const pendingVisible =
        job.checklist_items?.filter(
          (item: any) => canSeeItem(item.target_role) && !item.is_completed,
        ) || [];

      pendingVisible.forEach((task: any) => {
        if (!groups[task.item_description]) {
          groups[task.item_description] = [];
        }
        groups[task.item_description].push({
          ...task,
          customer_name: job.customer_name,
          actual_job_id: job.actual_job_id,
        });
      });
    });

    return groups;
  }, [jobs, canSeeItem]);

  return (
    <div className="space-y-10 mb-10">
      {/* SUMMARY TILES - Standardized Size */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile
          label="Total Assigned"
          count={stats.total}
          icon={<ClipboardList size={18} />}
          color="border-slate-900 bg-slate-900 text-white"
        />
        <StatTile
          label="Pending Jobs"
          count={stats.pending}
          icon={<Clock size={18} />}
          color="border-amber-500 bg-white text-slate-900"
        />
        <StatTile
          label="My Completed"
          count={stats.completed}
          icon={<CheckCircle2 size={18} />}
          color="border-emerald-500 bg-white text-slate-900"
        />
      </div>

      {/* ACCORDION LIST */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-1 h-4 bg-slate-900 rounded-full" />
          <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Pending Task Groups ({Object.keys(groupedPending).length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(groupedPending).map(([title, items]) => (
            <TaskAccordion key={title} title={title} items={items} />
          ))}
        </div>
      </div>

      <hr className="border-slate-200" />
    </div>
  );
}

// --- SUB-COMPONENT: TaskAccordion ---

function TaskAccordion({ title, items }: { title: string; items: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`bg-white rounded-4xl border transition-all duration-300 flex flex-col overflow-hidden ${
        isOpen ? "border-slate-900 shadow-md" : "border-slate-200 shadow-sm"
      }`}
    >
      {/* Accordion Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-5 flex justify-between items-center text-left gap-4"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-tight">
            {title}
          </h3>
          <p className="text-sm font-bold text-red-500 mt-1">
            {items.length} Jobs Pending
          </p>
        </div>
        <div
          className={`p-2 rounded-xl transition-colors ${isOpen ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-400"}`}
        >
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-h-60 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all flex justify-between items-center group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Hash size={10} className="text-blue-600" />
                    <span className="text-[9px] font-black text-blue-600 tracking-tighter uppercase">
                      {item.actual_job_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User size={10} className="text-slate-400" />
                    <p className="text-[11px] font-bold text-slate-700 truncate">
                      {item.customer_name}
                    </p>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                    <CheckCircle2 size={12} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, count, icon, color }: any) {
  return (
    <div
      className={`${color} border-t-4 p-6 rounded-4xl shadow-sm flex justify-between items-start`}
    >
      <div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70">
          {label}
        </p>
        <p className="text-4xl font-black mt-1 tracking-tighter">{count}</p>
      </div>
      <div className="opacity-20 mt-1">{icon}</div>
    </div>
  );
}
