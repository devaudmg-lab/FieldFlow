import { Database } from './database';

// 1. Raw Table Row Types
export type Company = Database['public']['Tables']['companies']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileAlias = Database['public']['Tables']['profile_aliases']['Row'];
export type Job = Database['public']['Tables']['jobs']['Row'];
export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
export type MediaUpload = Database['public']['Tables']['media_uploads']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_history']['Row'];

// 2. Strict Sub-types (Enums extracted from Schema)
// This ensures your UI only uses roles defined in the DB
export type UserRole = Profile['roles'][number]; // "admin" | "assessor" | "worker" | "agent"
export type JobStatus = Job['status']; // "pending" | "completed"

// 3. Composite UI Types (For Joined Queries)

/**
 * Profile with its associated Company and Aliases.
 * Used in User Management and Profile headers.
 */
export interface FullProfile extends Profile {
  companies: Company | null;
  profile_aliases: ProfileAlias[];
}

/**
 * A Job including its ChecklistItems. 
 */
export interface JobWithTasks extends Job {
  checklist_items: ChecklistItem[];
}

/**
 * Complete Job view for Admins.
 * Includes tasks and the assigned worker's profile details.
 */
export interface JobWithFullDetails extends JobWithTasks {
  profiles: (Profile & { companies: Company | null }) | null;
}

// 4. Action & Payload Types

/**
 * Payload for the 'createNewUser' and 'updateUser' server actions.
 */
export interface UserUpdatePayload {
  username: string;
  roles: UserRole[];
  is_active: boolean;
  companyData: {
    id?: string | null;
    name?: string | null;
  } | null;
  aliases: Array<{ name: string; is_primary: boolean }>;
}

export interface UploadPayload {
  jobId: string;
  checklistItemId: string;
  files: File[]; 
}

// 5. Analytics & Dashboard Types
export interface AdminStats {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  activeWorkers: number;
  totalCompanies: number;
}