import { z } from 'zod';

export const patientSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  age: z
    .string()
    .refine((v) => {
      const n = parseInt(v);
      return !isNaN(n) && n >= 0 && n <= 150;
    }, 'Age must be between 0 and 150'),
  gender: z.enum(['male', 'female', 'other'], { required_error: 'Please select a gender' }),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || v.length >= 7, 'Phone number too short'),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Invalid email address'),
  patient_id_number: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

// Medical value hard limits (physiologically impossible values)
export const MEDICAL_HARD_LIMITS: Record<string, { min: number; max: number; label: string }> = {
  hemoglobin: { min: 0, max: 25, label: 'Hemoglobin' },
  wbc: { min: 0, max: 500000, label: 'WBC' },
  rbc: { min: 0, max: 10, label: 'RBC' },
  platelets: { min: 0, max: 2000000, label: 'Platelets' },
  hematocrit: { min: 0, max: 80, label: 'Hematocrit' },
  mcv: { min: 0, max: 200, label: 'MCV' },
  mch: { min: 0, max: 100, label: 'MCH' },
  mchc: { min: 0, max: 50, label: 'MCHC' },
  total_bilirubin: { min: 0, max: 50, label: 'Total Bilirubin' },
  direct_bilirubin: { min: 0, max: 40, label: 'Direct Bilirubin' },
  sgpt: { min: 0, max: 10000, label: 'SGPT/ALT' },
  sgot: { min: 0, max: 10000, label: 'SGOT/AST' },
  alkaline_phosphatase: { min: 0, max: 5000, label: 'Alkaline Phosphatase' },
  total_protein: { min: 0, max: 20, label: 'Total Protein' },
  albumin: { min: 0, max: 10, label: 'Albumin' },
  urea: { min: 0, max: 500, label: 'Urea' },
  creatinine: { min: 0, max: 50, label: 'Creatinine' },
  uric_acid: { min: 0, max: 30, label: 'Uric Acid' },
  total_cholesterol: { min: 0, max: 1000, label: 'Total Cholesterol' },
  triglycerides: { min: 0, max: 5000, label: 'Triglycerides' },
  hdl: { min: 0, max: 200, label: 'HDL' },
  ldl: { min: 0, max: 800, label: 'LDL' },
  esr: { min: 0, max: 200, label: 'ESR' },
  blood_sugar: { min: 0, max: 1000, label: 'Blood Sugar' },
  fasting_blood_sugar: { min: 0, max: 1000, label: 'Fasting Blood Sugar' },
  random_blood_sugar: { min: 0, max: 1500, label: 'Random Blood Sugar' },
  serum_calcium: { min: 0, max: 25, label: 'Serum Calcium' },
  sodium: { min: 0, max: 200, label: 'Sodium' },
  potassium: { min: 0, max: 15, label: 'Potassium' },
};
