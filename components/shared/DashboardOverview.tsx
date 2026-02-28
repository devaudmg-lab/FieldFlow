import React from 'react';

interface Job {
  id: string;
  status: string;
  customer_name: string;
}

interface ChecklistItem {
  id: string;
  job_id: string;
  item_description: string;
  target_role: string;
  jobs: Job; // Joined from Supabase
}

interface DashboardProps {
  allJobs: Job[];
  pendingItems: ChecklistItem[];
  isAdmin?: boolean;
}

export default function DashboardOverview({ allJobs, pendingItems, isAdmin }: DashboardProps) {
  // 1. Calculate Tile Stats
  const total = allJobs.length;
  const completed = allJobs.filter(j => j.status === 'completed').length;
  const pending = allJobs.filter(j => j.status === 'pending').length;

  // 2. Group Pending Checklist Items by Description
  const groupedChecklist = pendingItems.reduce((acc, item) => {
    const desc = item.item_description;
    if (!acc[desc]) acc[desc] = [];
    acc[desc].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* SECTION: SUMMARY TILES */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            {isAdmin ? "Global Statistics" : "My Performance"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatTile label="All Tasks" count={total} color="border-blue-500" />
            <StatTile label="Pending" count={pending} color="border-amber-500" />
            <StatTile label="Completed" count={completed} color="border-emerald-500" />
          </div>
        </section>

        <hr className="border-gray-200" />

        {/* SECTION: PENDING CHECKLIST TILES */}
        <section>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Pending Checklist Breakdown
          </h2>
          
          {Object.keys(groupedChecklist).length === 0 ? (
            <div className="p-10 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500">No pending checklist items found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(groupedChecklist).map(([title, items]) => (
                <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header */}
                  <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
                    <span className="text-red-700 font-bold text-xs uppercase">Pending</span>
                    <span className="bg-red-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                      {items.length}
                    </span>
                  </div>
                  
                  {/* Body */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.id} className="group p-3 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-100 transition-colors">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono text-blue-600 font-bold">#{item.job_id}</span>
                            {isAdmin && (
                              <span className="text-[9px] bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 uppercase">
                                {item.target_role}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-gray-800 mt-1">
                            {item.jobs?.customer_name || 'Unknown Customer'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Single Stat Tile Sub-component
 */
function StatTile({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border-l-8 ${color} flex flex-col justify-center`}>
      <p className="text-gray-500 text-sm font-semibold uppercase">{label}</p>
      <p className="text-4xl font-black text-gray-800 mt-1">{count}</p>
    </div>
  );
}