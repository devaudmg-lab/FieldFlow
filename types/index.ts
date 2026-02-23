import { Database } from './database';

// 1. Raw Row Types (Extracted directly from your Database Schema)
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Job = Database['public']['Tables']['jobs']['Row'];
export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
export type MediaUpload = Database['public']['Tables']['media_uploads']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_history']['Row'];

// 2. Enums and Literal Types (For strict validation)
export type UserRole = 'admin' | 'worker';
export type JobStatus = 'pending' | 'completed';

// 3. Composite UI Types (For joined queries)

/**
 * A Job including its ChecklistItems. 
 * Use this in the Worker Dashboard and Job Detail pages.
 */
export interface JobWithTasks extends Job {
  checklist_items: ChecklistItem[];
}

/**
 * A Job including its ChecklistItems and the assigned Profile.
 * Useful for the Admin view.
 */
export interface JobWithFullDetails extends JobWithTasks {
  assigned_worker: Profile | null;
}

// 4. Action & Payload Types

/**
 * Payload for multi-file uploads.
 * Enforces your "Limit 10" requirement in the logic.
 */
export interface UploadPayload {
  jobId: string;
  checklistItemId: string;
  files: File[]; 
}

/**
 * Structure for the Admin Excel Upload.
 * This represents a single row in the Admin's Excel file.
 */
export interface ExcelJobUploadRow {
  JobID: string;
  Title: string;
  Date: string; // ISO string or Date object
  WorkerUsername: string;
  ChecklistItems: string; // Typically a comma-separated list like "Wire Missing, Pipes Checked"
}

// 5. Analytics Types
export interface AdminStats {
  totalJobs: number;
  pendingJobs: number;
  completedJobs: number;
  activeWorkers: number;
}