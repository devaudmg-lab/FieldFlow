"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/database";

// --- Types ---
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type RoleType = Database['public']['Tables']['profiles']['Row']['roles'][number];

interface AliasInput {
  name: string;
  is_primary: boolean;
}

interface CompanyData {
  id?: string | null;   // Provided when selecting existing
  name?: string | null; // Provided when creating new
}

interface UserData {
  username: string;
  roles: RoleType[];
  is_active: boolean;
  aliases: AliasInput[];
  companyData?: CompanyData | null;
}

// --- Helpers ---

/**
 * Ensures a company exists and returns its ID.
 * Uses upsert to prevent race-condition duplicates on the name.
 */
async function resolveCompanyId(supabase: any, companyData: CompanyData): Promise<string | null> {
  // Scenario A: Linking to an existing record via ID
  if (companyData.id) {
    return companyData.id;
  }

  // Scenario B: Creating a new company entry via Name
  if (companyData.name) {
    const { data, error } = await supabase
      .from("companies")
      .upsert(
        { name: companyData.name.trim() }, 
        { onConflict: "name" }
      )
      .select("id")
      .single();

    if (error) throw new Error(`Company Resolution Error: ${error.message}`);
    return data.id;
  }

  return null;
}

// --- Main Actions ---

/**
 * Creates a user in Auth, resolves their company, updates profile, and adds aliases.
 */
export async function createNewUser(
  data: UserData & { email: string; password: string },
) {
  const supabase = await createAdminClient();
  
  try {
    // 1. Determine Company Link (Only if "agent" role is present)
    let resolvedCompanyId: string | null = null;
    if (data.roles.includes("agent") && data.companyData) {
      resolvedCompanyId = await resolveCompanyId(supabase, data.companyData);
    }

    // 2. Create User in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username },
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 3. Update the Profile record
    // We use .update because a DB trigger usually creates the initial row on Auth signup
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        username: data.username,
        roles: data.roles,
        is_active: true,
        company_id: resolvedCompanyId,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 4. Batch Insert Aliases
    if (data.aliases.length > 0) {
      const aliasPayload = data.aliases.map((alias) => ({
        profile_id: userId,
        alias_name: alias.name,
        is_primary: alias.is_primary,
      }));

      const { error: aliasError } = await supabase
        .from("profile_aliases")
        .insert(aliasPayload);
        
      if (aliasError) throw aliasError;
    }

    revalidatePath("/admin/users");
    return { success: true };

  } catch (error: any) {
    console.error("Critical Error in createNewUser:", error.message);
    return { error: error.message };
  }
}

/**
 * Updates an existing user and refreshes their company and alias associations.
 */
export async function updateUser(userId: string, data: UserData) {
  const supabase = await createAdminClient();

  try {
    // 1. Resolve Company ID
    let resolvedCompanyId: string | null = null;
    if (data.roles.includes("agent") && data.companyData) {
      resolvedCompanyId = await resolveCompanyId(supabase, data.companyData);
    }

    // 2. Update Profile Table
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        username: data.username,
        roles: data.roles,
        is_active: data.is_active,
        company_id: resolvedCompanyId,
      })
      .eq("id", userId);

    if (profileError) throw profileError;

    // 3. Sync Auth Metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { username: data.username },
    });

    // 4. Sync Aliases (Delete existing and re-insert new set)
    await supabase
      .from("profile_aliases")
      .delete()
      .eq("profile_id", userId);

    if (data.aliases.length > 0) {
      const { error: insertError } = await supabase
        .from("profile_aliases")
        .insert(
          data.aliases.map((a) => ({
            profile_id: userId,
            alias_name: a.name,
            is_primary: a.is_primary,
          })),
        );
      if (insertError) throw insertError;
    }

    revalidatePath("/admin/users");
    return { success: true };

  } catch (error: any) {
    console.error("Critical Error in updateUser:", error.message);
    return { error: error.message };
  }
}

/**
 * Deletes a user from Auth (cascading deletes usually handle profiles/aliases)
 */
export async function deleteUser(userId: string) {
  const supabase = await createAdminClient();
  
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    console.error("Delete Error:", error.message);
    return { error: error.message };
  }
  
  revalidatePath("/admin/users");
  return { success: true };
}