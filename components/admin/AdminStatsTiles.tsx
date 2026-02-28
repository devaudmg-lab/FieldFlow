"use client";

import React, { useMemo, useState } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AdminStatsTilesProps {
  jobs: any[];
}

export default function AdminStatsTiles({ jobs }: AdminStatsTilesProps) {
  // Track expanded bottleneck tiles using a composite key (username + title)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const toggleAccordion = (id: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const userBreakdown = useMemo(() => {
    const userMap: Record<string, any> = {};

    jobs.forEach((job) => {
      const assessorName =
        job.assessor?.username ||
        "Assessor Not Found (ID: " + job.assigned_accessor_id + ")";
      const assessorId = job.assigned_accessor_id;

      if (!assessorId) return;

      if (!userMap[assessorName]) {
        userMap[assessorName] = {
          username: assessorName,
          roleType: "assessor",
          totalJobs: 0,
          pendingJobs: 0,
          completedJobs: 0,
          bottlenecks: {} as Record<string, string[]>,
          processedJobIds: new Set(),
        };
      }

      const user = userMap[assessorName];

      if (!user.processedJobIds.has(job.id)) {
        user.processedJobIds.add(job.id);
        user.totalJobs += 1;

        const roleTasks =
          job.checklist_items?.filter(
            (item: any) =>
              item.target_role?.trim().toLowerCase() === "assessor",
          ) || [];

        const pendingTasks = roleTasks.filter((t: any) => !t.is_completed);

        if (roleTasks.length > 0 && pendingTasks.length > 0) {
          user.pendingJobs += 1;

          pendingTasks.forEach((task: any) => {
            if (!user.bottlenecks[task.item_description]) {
              user.bottlenecks[task.item_description] = [];
            }
            if (
              !user.bottlenecks[task.item_description].includes(
                job.actual_job_id,
              )
            ) {
              user.bottlenecks[task.item_description].push(job.actual_job_id);
            }
          });
        } else {
          user.completedJobs += 1;
        }
      }
    });

    return Object.values(userMap).sort((a, b) => b.pendingJobs - a.pendingJobs);
  }, [jobs]);

  return (
    <div className="space-y-10">
      {userBreakdown.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
            No Assessor Assignments Found
          </p>
        </div>
      ) : (
        userBreakdown.map((user) => (
          <div
            key={user.username}
            className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
          >
            {/* USER HEADER */}
            <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mt-1">
                    {user.username}
                  </h3>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 md:gap-4 w-full md:w-auto">
                <StatItem
                  label="Assigned"
                  value={user.totalJobs}
                  icon={<Users className="text-blue-600" size={15} />}
                  color="text-slate-900"
                />
                <StatItem
                  label="Pending"
                  value={user.pendingJobs}
                  icon={<Clock className="text-red-600" size={15} />}
                  color="text-amber-600"
                />
                <StatItem
                  label="Completed"
                  value={user.completedJobs}
                  icon={<CheckCircle2 className="text-green-600" size={15} />}
                  color="text-emerald-600"
                />
              </div>
            </div>

            {/* BOTTLENECK ACCORDION GRID */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(user.bottlenecks).map(([title, jobIds]) => {
                  const itemKey = `${user.username}-${title}`;
                  const isExpanded = !!expandedItems[itemKey];

                  return (
                    <div
                      key={title}
                      className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm border-l-4 border-l-red-500 flex flex-col"
                    >
                      {/* Accordion Trigger */}
                      <button
                        onClick={() => toggleAccordion(itemKey)}
                        className="w-full text-left p-5 flex justify-between items-start hover:bg-slate-50 transition-colors"
                      >
                        <div className="w-4/5">
                          <p className="text-[11px] sm:text-sm font-black text-slate-500 uppercase tracking-tight leading-tight">
                            {title}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="bg-red-500 text-white text-sm font-black px-4 py-2 rounded-lg">
                            {(jobIds as string[]).length}
                          </span>
                          {isExpanded ? (
                            <ChevronUp size={16} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={16} className="text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-1 duration-200">
                          <div className="pt-3 border-t border-slate-50">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-2">
                              Impacted Jobs:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(jobIds as string[]).map((id) => (
                                <span
                                  key={id}
                                  className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200"
                                >
                                  #{id}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StatItem({
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
    <div className="bg-white border border-slate-100 p-6 rounded-2xl flex-1 md:min-w-40 shadow-sm">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
          {label}
        </p>
      </div>
      <p className={`text-3xl font-black leading-none ${color}`}>{value}</p>
    </div>
  );
}
