"use server";

import { createAdminClient } from "@/lib/supabase/server";

export async function getCompanies() {
  const supabase = await createAdminClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
  return data;
}
