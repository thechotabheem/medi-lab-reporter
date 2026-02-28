export type Gender = 'male' | 'female' | 'other';
export type ReportType = 
  | 'blood_test' 
  | 'urine_analysis' 
  | 'hormone_immunology'
  | 'microbiology'
  | 'ultrasound'
  | 'screening_tests' 
  | 'blood_group_typing'
  | 'cbc'
  | 'lft'
  | 'rft'
  | 'lipid_profile'
  | 'esr'
  | 'bsr'
  | 'bsf'
  | 'serum_calcium'
  | 'mp'
  | 'typhoid'
  | 'hcv'
  | 'hbsag'
  | 'hiv'
  | 'vdrl'
  | 'h_pylori'
  | 'blood_group'
  | 'ra_factor'
  | 'combined';
export type AppRole = 'admin' | 'lab_technician' | 'receptionist';
export type ReportStatus = 'draft' | 'completed' | 'verified';

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  header_text?: string;
  footer_text?: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  clinic_id: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Patient {
  id: string;
  clinic_id: string;
  patient_id_number?: string;
  full_name: string;
  gender: Gender;
  date_of_birth: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  clinic_id: string;
  patient_id: string;
  created_by?: string;
  report_type: ReportType;
  report_number: string;
  test_date: string;
  referring_doctor?: string;
  clinical_notes?: string;
  status: ReportStatus;
  report_data: Record<string, unknown>;
  included_tests?: string[] | null; // For combined reports
  created_at: string;
  updated_at: string;
  patient?: Patient;
}

export interface ReportImage {
  id: string;
  report_id: string;
  image_url: string;
  caption?: string;
  created_at: string;
}

// Report template field definitions
export interface TestField {
  name: string;
  label: string;
  unit?: string;
  normalRange?: {
    min?: number;
    max?: number;
    male?: { min?: number; max?: number };
    female?: { min?: number; max?: number };
  };
  type: 'number' | 'text' | 'select' | 'textarea';
  options?: string[];
  calculated?: boolean;
  formula?: string;
}

export interface TestCategory {
  name: string;
  fields: TestField[];
}

export interface ReportTemplate {
  type: ReportType;
  name: string;
  categories: TestCategory[];
}
