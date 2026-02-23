"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Database } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";

// --- Types ---
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type RoleType = Database["public"]["Tables"]["profiles"]["Row"]["roles"][number];
type AliasInsert = Database["public"]["Tables"]["profile_aliases"]["Insert"];

interface AliasInput {
  name: string;
  is_primary: boolean;
}

interface CompanyData {
  id?: string | null;   
  name?: string | null; 
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
 * Casts the table reference to bypass 'never' inference.
 */
async function resolveCompanyId(
  supabase: SupabaseClient<Database>, 
  companyData: CompanyData
): Promise<string | null> {
  if (companyData.id) return companyData.id;

  if (companyData.name) {
    // FIX: Cast .from() as any to allow .upsert()
    const { data, error } = await (supabase.from("companies") as any)
      .upsert(
        { name: companyData.name.trim() }, 
        { onConflict: "name" }
      )
      .select("id")
      .single();

    if (error) throw new Error(`Company Resolution Error: ${error.message}`);
    
    const resolved = data as unknown as { id: string };
    return resolved.id;
  }

  return null;
}

// --- Main Actions ---

export async function createNewUser(
  data: UserData & { email: string; password: string },
) {
  const supabase = (await createAdminClient()) as SupabaseClient<Database>;
  
  try {
    let resolvedCompanyId: string | null = null;
    if (data.roles.includes("agent") && data.companyData) {
      resolvedCompanyId = await resolveCompanyId(supabase, data.companyData);
    }

    // 1. Create User in Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username },
    });

    if (authError) throw authError;
    const userId = authData.user.id;

    // 2. Update the Profile record
    const profileUpdate: ProfileUpdate = {
      username: data.username,
      roles: data.roles,
      is_active: true,
      company_id: resolvedCompanyId,
    };

    // FIX: Cast .from() as any to allow .update()
    const { error: profileError } = await (supabase.from("profiles") as any)
      .update(profileUpdate)
      .eq("id", userId);

    if (profileError) throw profileError;

    // 3. Batch Insert Aliases
    if (data.aliases.length > 0) {
      const aliasPayload: AliasInsert[] = data.aliases.map((alias) => ({
        profile_id: userId,
        alias_name: alias.name,
        is_primary: alias.is_primary,
      }));

      // FIX: Cast .from() as any to allow .insert()
      const { error: aliasError } = await (supabase.from("profile_aliases") as any)
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

export async function updateUser(userId: string, data: UserData) {
  const supabase = (await createAdminClient()) as SupabaseClient<Database>;

  try {
    let resolvedCompanyId: string | null = null;
    if (data.roles.includes("agent") && data.companyData) {
      resolvedCompanyId = await resolveCompanyId(supabase, data.companyData);
    }

    // 1. Update Profile Table
    const profileUpdate: ProfileUpdate = {
      username: data.username,
      roles: data.roles,
      is_active: data.is_active,
      company_id: resolvedCompanyId,
    };

    // FIX: Cast .from() as any to allow .update()
    const { error: profileError } = await (supabase.from("profiles") as any)
      .update(profileUpdate)
      .eq("id", userId);

    if (profileError) throw profileError;

    // 2. Sync Auth Metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { username: data.username },
    });

    // 3. Sync Aliases
    await (supabase.from("profile_aliases") as any)
      .delete()
      .eq("profile_id", userId);

    if (data.aliases.length > 0) {
      const aliasPayload: AliasInsert[] = data.aliases.map((a) => ({
        profile_id: userId,
        alias_name: a.name,
        is_primary: a.is_primary,
      }));

      // FIX: Cast .from() as any to allow .insert()
      const { error: insertError } = await (supabase.from("profile_aliases") as any)
        .insert(aliasPayload);

      if (insertError) throw insertError;
    }

    revalidatePath("/admin/users");
    return { success: true };

  } catch (error: any) {
    console.error("Critical Error in updateUser:", error.message);
    return { error: error.message };
  }
}

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