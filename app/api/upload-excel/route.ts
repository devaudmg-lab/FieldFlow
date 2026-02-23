import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * Utility to handle various Excel date formats (Date objects or String matches)
 */
function formatExcelDate(excelDate: any): string | null {
  if (!excelDate) return null;

  const date = new Date(excelDate);
  if (!isNaN(date.getTime()) && typeof excelDate !== "string") {
    return date.toISOString().split("T")[0];
  }

  const dateStr = String(excelDate).trim();
  const match = dateStr.match(
    /^(\d{1,2})-(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-(\d{2,4})$/i,
  );

  if (match) {
    const months: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };
    const day = match[1].padStart(2, "0");
    const month = months[match[2].toLowerCase()];
    let year = match[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  const finalTry = new Date(dateStr);
  return !isNaN(finalTry.getTime())
    ? finalTry.toISOString().split("T")[0]
    : null;
}

export async function POST(request: Request) {
  try {
    const { data, job_category } = await request.json();
    const skipValues = ["assessment only", "all good", "n/a", ""];

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 },
      );
    }

    // --- 1. COLLECT NAMES AND COMPANY NAMES ---
    const uniqueAliasNames = new Set<string>();
    const uniqueCompanyNames = new Set<string>();

    data.forEach((row) => {
      if (row["ASSESSOR'S' NAME"])
        uniqueAliasNames.add(row["ASSESSOR'S' NAME"].trim());
      if (row["INSTALLER FIELD WORKER NAME (PLUMBER)"])
        uniqueAliasNames.add(
          row["INSTALLER FIELD WORKER NAME (PLUMBER)"].trim(),
        );
      if (row["ELECTRICIAN'S' NAME"])
        uniqueAliasNames.add(row["ELECTRICIAN'S' NAME"].trim());

      // "AGENT" in Excel refers to the Company Name
      if (row["AGENT"]) uniqueCompanyNames.add(row["AGENT"].trim());
    });

    // --- 2. LOOKUP ALIASES (Assessors, Workers) ---
    const { data: aliasData } = await supabaseAdmin
      .from("profile_aliases")
      .select("alias_name, profile_id")
      .in("alias_name", Array.from(uniqueAliasNames));

    const aliasToProfileId: Record<string, string> = {};
    aliasData?.forEach((a) => {
      aliasToProfileId[a.alias_name] = a.profile_id;
    });

    // --- 3. LOOKUP AGENT VIA COMPANY NAME ---
    // A. Get Company IDs from Company Names
    const { data: companies } = await supabaseAdmin
      .from("companies")
      .select("id, name")
      .in("name", Array.from(uniqueCompanyNames));

    const companyNameToId: Record<string, string> = {};
    const companyIds: string[] = [];

    companies?.forEach((c) => {
      companyNameToId[c.name] = c.id;
      companyIds.push(c.id);
    });

    // B. Find Profiles that belong to these companies and have 'agent' role
    const { data: agentProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, company_id")
      .in("company_id", companyIds)
      .contains("roles", ["agent"]);

    // Map: Company Name -> Agent Profile ID
    const companyNameToAgentId: Record<string, string> = {};
    agentProfiles?.forEach((profile) => {
      const cName = companies?.find((c) => c.id === profile.company_id)?.name;
      if (cName) {
        companyNameToAgentId[cName] = profile.id;
      }
    });

    const allChecklistItems: any[] = [];
    const jobsToUpsert: any[] = [];

    // --- 4. PROCESS ROWS ---
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const jobId = row["JOBROWID"]?.toString();

      if (!jobId) continue;

      const accessorId =
        aliasToProfileId[row["ASSESSOR'S' NAME"]?.trim()] || null;
      const plumberId =
        aliasToProfileId[
          row["INSTALLER FIELD WORKER NAME (PLUMBER)"]?.trim()
        ] || null;
      const elecId =
        aliasToProfileId[row["ELECTRICIAN'S' NAME"]?.trim()] || null;

      // Look up agent by the Company Name found in "AGENT" column
      const agentCompanyName = row["AGENT"]?.trim();
      const agentId = agentCompanyName
        ? companyNameToAgentId[agentCompanyName]
        : null;

      jobsToUpsert.push({
        id: jobId,
        actual_job_id: row["JOB ID"] || "N/A",
        state_category: row["STATE"] || "Unknown",
        job_category: job_category,
        assigned_accessor_id: accessorId,
        assigned_plumber_id: plumberId,
        assigned_elec_id: elecId,
        assigned_agent_id: agentId,
        status: row["JOB PASSED/FAIL"] === "Passed" ? "completed" : "pending",
        complete_date: formatExcelDate(row["COMPLETED DATE"]),
        customer_name: row["CUSTOMER NAME"] || "Unknown",
        customer_phone: row["PHONE"]?.toString() || "N/A",
        customer_address: row["ADDRESS"] || "N/A",
        customer_suburb: row["SUBURB"] || "N/A",
        customer_postcode: row["POSTCODE"]?.toString() || "N/A",
        phone_audit: row["PHONE AUDIT"] || null,
      });

      // Checklist logic
      const leadGenRaw = (row["LEAD GEN"] || "").toString();
      const installersRaw = (row["INSTALLERS"] || "").toString();

      [
        { raw: leadGenRaw, role: "assessor" },
        { raw: installersRaw, role: "worker" },
      ].forEach((group) => {
        if (group.raw && !skipValues.includes(group.raw.toLowerCase().trim())) {
          group.raw.split(";").forEach((task: string) => {
            if (task.trim()) {
              allChecklistItems.push({
                job_id: jobId,
                item_description: task.trim(),
                target_role: group.role,
                is_completed: false,
              });
            }
          });
        }
      });
    }

    // --- 5. DATABASE OPERATIONS ---
    if (jobsToUpsert.length === 0) {
      return NextResponse.json(
        { error: "No valid jobs found." },
        { status: 400 },
      );
    }

    // Upsert Jobs
    const { error: jobError } = await supabaseAdmin
      .from("jobs")
      .upsert(jobsToUpsert, { onConflict: "id" });

    if (jobError) throw jobError;

    // Handle Checklists (Delete old, Insert new)
    if (allChecklistItems.length > 0) {
      const jobIdsToDelete = [
        ...new Set(allChecklistItems.map((item) => item.job_id)),
      ];

      const { error: deleteError } = await supabaseAdmin
        .from("checklist_items")
        .delete()
        .in("job_id", jobIdsToDelete);

      if (deleteError) throw deleteError;

      const { error: checklistError } = await supabaseAdmin
        .from("checklist_items")
        .insert(allChecklistItems);

      if (checklistError) throw checklistError;
    }

    return NextResponse.json(
      { message: `Successfully processed ${jobsToUpsert.length} jobs.` },
      { status: 200 },
    );
  } catch (error: any) {
    console.error(">>> [API ERROR]:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
