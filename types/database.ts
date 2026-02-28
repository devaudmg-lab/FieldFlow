  export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

  export interface Database {
    public: {
      Tables: {
        companies: {
          Row: {
            id: string;
            name: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            name: string;
            created_at?: string;
          };
          Update: {
            name?: string;
          };
        };
        profiles: {
          Row: {
            id: string;
            username: string;
            roles: ("admin" | "assessor" | "worker" | "agent")[];
            is_active: boolean;
            company_id: string | null; // Link to companies table
          };
          Insert: {
            id: string;
            username: string;
            roles?: ("admin" | "assessor" | "worker" | "agent")[];
            is_active?: boolean;
            company_id?: string | null;
          };
          Update: {
            username?: string;
            roles?: ("admin" | "assessor" | "worker" | "agent")[];
            is_active?: boolean;
            company_id?: string | null;
          };
        };
        profile_aliases: {
          Row: {
            id: string;
            profile_id: string;
            alias_name: string;
            is_primary: boolean;
            created_at: string;
          };
          Insert: {
            id?: string;
            profile_id: string;
            alias_name: string;
            is_primary?: boolean;
            created_at?: string;
          };
          Update: {
            alias_name?: string;
            is_primary?: boolean;
          };
        };
        jobs: {
          Row: {
            id: string;
            title: string;
            scheduled_date: string;
            assigned_worker_id: string | null;
            status: "pending" | "completed";
            created_at: string;
          };
          Insert: {
            id: string;
            title: string;
            scheduled_date: string;
            assigned_worker_id?: string | null;
            status?: "pending" | "completed";
            created_at?: string;
          };
          Update: {
            title?: string;
            scheduled_date?: string;
            assigned_worker_id?: string | null;
            status?: "pending" | "completed";
          };
        };
        checklist_items: {
          Row: {
            id: string;
            job_id: string;
            item_description: string;
            is_completed: boolean;
            completed_at: string | null;
          };
          Insert: {
            id?: string;
            job_id: string;
            item_description: string;
            is_completed?: boolean;
            completed_at?: string | null;
          };
          Update: {
            item_description?: string;
            is_completed?: boolean;
            completed_at?: string | null;
          };
        };
        media_uploads: {
          Row: {
            id: string;
            job_id: string;
            checklist_item_id: string;
            storage_path: string;
            file_size_kb: number | null;
            file_type: string | null;
            uploaded_at: string;
          };
          Insert: {
            id?: string;
            job_id: string;
            checklist_item_id: string;
            storage_path: string;
            file_size_kb?: number | null;
            file_type?: string | null;
          };
          Update: {
            storage_path?: string;
            file_size_kb?: number | null;
            file_type?: string | null;
          };
        };
        activity_history: {
          Row: {
            id: number;
            user_id: string | null;
            action_code: string;
            details: Json;
            created_at: string;
          };
          Insert: {
            id?: number;
            user_id?: string | null;
            action_code: string;
            details: Json;
            created_at?: string;
          };
        };
      };
    };
  }
