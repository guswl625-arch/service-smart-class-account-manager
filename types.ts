
export interface Student {
  id: string;
  name: string;
  entranceCode: string;
  teacher_id?: string;
}

export interface Site {
  id: string;
  name: string;
  url: string;
  description: string;
  teacher_id?: string;
}

export interface Account {
  id: string;
  siteId: string;
  studentId: string;
  username: string;
  password: string; // This remains encrypted locally
  teacher_id?: string;
}

export type AuthRole = 'teacher' | 'student' | null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface AppState {
  students: Student[];
  sites: Site[];
  accounts: Account[];
  teacherCode: string;
  supabaseConfig?: SupabaseConfig;
}
