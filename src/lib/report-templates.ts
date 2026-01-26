import { ReportTemplate, ReportType } from '@/types/database';

export const reportTemplates: Record<ReportType, ReportTemplate> = {
  // Legacy types (kept for backward compatibility)
  blood_test: {
    type: 'blood_test',
    name: 'Blood Test (Legacy)',
    categories: [],
  },
  urine_analysis: {
    type: 'urine_analysis',
    name: 'Urine Analysis (Legacy)',
    categories: [],
  },
  screening_tests: {
    type: 'screening_tests',
    name: 'Screening Tests (Legacy)',
    categories: [],
  },
  blood_group_typing: {
    type: 'blood_group_typing',
    name: 'Blood Group Typing (Legacy)',
    categories: [],
  },

  // VALUE BASED TESTS
  cbc: {
    type: 'cbc',
    name: 'Complete Blood Count (CBC)',
    categories: [
      {
        name: 'CBC Parameters',
        fields: [
          { name: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', normalRange: { male: { min: 13.5, max: 17.5 }, female: { min: 12.0, max: 16.0 } }, type: 'number' },
          { name: 'rbc', label: 'RBC Count', unit: 'million/μL', normalRange: { male: { min: 4.5, max: 5.5 }, female: { min: 4.0, max: 5.0 } }, type: 'number' },
          { name: 'wbc', label: 'WBC Count', unit: 'cells/μL', normalRange: { min: 4500, max: 11000 }, type: 'number' },
          { name: 'platelets', label: 'Platelet Count', unit: 'cells/μL', normalRange: { min: 150000, max: 400000 }, type: 'number' },
          { name: 'hematocrit', label: 'Hematocrit (PCV)', unit: '%', normalRange: { male: { min: 38.3, max: 48.6 }, female: { min: 35.5, max: 44.9 } }, type: 'number' },
          { name: 'mcv', label: 'MCV', unit: 'fL', normalRange: { min: 80, max: 100 }, type: 'number' },
          { name: 'mch', label: 'MCH', unit: 'pg', normalRange: { min: 27, max: 33 }, type: 'number' },
          { name: 'mchc', label: 'MCHC', unit: 'g/dL', normalRange: { min: 32, max: 36 }, type: 'number' },
          { name: 'rdw', label: 'RDW', unit: '%', normalRange: { min: 11.5, max: 14.5 }, type: 'number' },
          { name: 'mpv', label: 'MPV', unit: 'fL', normalRange: { min: 7.5, max: 11.5 }, type: 'number' },
          { name: 'neutrophils', label: 'Neutrophils', unit: '%', normalRange: { min: 40, max: 70 }, type: 'number' },
          { name: 'lymphocytes', label: 'Lymphocytes', unit: '%', normalRange: { min: 20, max: 45 }, type: 'number' },
          { name: 'monocytes', label: 'Monocytes', unit: '%', normalRange: { min: 2, max: 10 }, type: 'number' },
          { name: 'eosinophils', label: 'Eosinophils', unit: '%', normalRange: { min: 1, max: 6 }, type: 'number' },
          { name: 'basophils', label: 'Basophils', unit: '%', normalRange: { min: 0, max: 1 }, type: 'number' },
        ],
      },
    ],
  },

  lft: {
    type: 'lft',
    name: 'Liver Function Test (LFT)',
    categories: [
      {
        name: 'LFT Parameters',
        fields: [
          { name: 'total_bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', normalRange: { min: 0.1, max: 1.2 }, type: 'number' },
          { name: 'direct_bilirubin', label: 'Direct Bilirubin', unit: 'mg/dL', normalRange: { min: 0, max: 0.3 }, type: 'number' },
          { name: 'indirect_bilirubin', label: 'Indirect Bilirubin', unit: 'mg/dL', normalRange: { min: 0.1, max: 0.9 }, type: 'number', calculated: true, formula: 'total_bilirubin - direct_bilirubin' },
          { name: 'sgot_ast', label: 'SGOT (AST)', unit: 'U/L', normalRange: { min: 5, max: 40 }, type: 'number' },
          { name: 'sgpt_alt', label: 'SGPT (ALT)', unit: 'U/L', normalRange: { min: 7, max: 56 }, type: 'number' },
          { name: 'alp', label: 'Alkaline Phosphatase (ALP)', unit: 'U/L', normalRange: { min: 44, max: 147 }, type: 'number' },
          { name: 'total_protein', label: 'Total Protein', unit: 'g/dL', normalRange: { min: 6.0, max: 8.3 }, type: 'number' },
          { name: 'albumin', label: 'Albumin', unit: 'g/dL', normalRange: { min: 3.5, max: 5.0 }, type: 'number' },
          { name: 'globulin', label: 'Globulin', unit: 'g/dL', normalRange: { min: 2.0, max: 3.5 }, type: 'number', calculated: true, formula: 'total_protein - albumin' },
          { name: 'ag_ratio', label: 'A/G Ratio', normalRange: { min: 1.0, max: 2.5 }, type: 'number', calculated: true, formula: 'albumin / globulin' },
          { name: 'ggt', label: 'GGT', unit: 'U/L', normalRange: { male: { min: 8, max: 61 }, female: { min: 5, max: 36 } }, type: 'number' },
        ],
      },
    ],
  },

  rft: {
    type: 'rft',
    name: 'Renal Function Test (RFT)',
    categories: [
      {
        name: 'RFT Parameters',
        fields: [
          { name: 'urea', label: 'Blood Urea', unit: 'mg/dL', normalRange: { min: 15, max: 40 }, type: 'number' },
          { name: 'bun', label: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', normalRange: { min: 7, max: 20 }, type: 'number', calculated: true, formula: 'urea * 0.467' },
          { name: 'creatinine', label: 'Serum Creatinine', unit: 'mg/dL', normalRange: { male: { min: 0.7, max: 1.3 }, female: { min: 0.6, max: 1.1 } }, type: 'number' },
          { name: 'uric_acid', label: 'Uric Acid', unit: 'mg/dL', normalRange: { male: { min: 3.4, max: 7.0 }, female: { min: 2.4, max: 6.0 } }, type: 'number' },
          { name: 'sodium', label: 'Sodium (Na+)', unit: 'mEq/L', normalRange: { min: 136, max: 145 }, type: 'number' },
          { name: 'potassium', label: 'Potassium (K+)', unit: 'mEq/L', normalRange: { min: 3.5, max: 5.0 }, type: 'number' },
          { name: 'chloride', label: 'Chloride (Cl-)', unit: 'mEq/L', normalRange: { min: 98, max: 106 }, type: 'number' },
          { name: 'egfr', label: 'eGFR', unit: 'mL/min/1.73m²', normalRange: { min: 90 }, type: 'number' },
        ],
      },
    ],
  },

  lipid_profile: {
    type: 'lipid_profile',
    name: 'Lipid Profile',
    categories: [
      {
        name: 'Lipid Profile Parameters',
        fields: [
          { name: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', normalRange: { max: 200 }, type: 'number' },
          { name: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', normalRange: { max: 150 }, type: 'number' },
          { name: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', normalRange: { male: { min: 40 }, female: { min: 50 } }, type: 'number' },
          { name: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', normalRange: { max: 100 }, type: 'number', calculated: true, formula: 'TC - HDL - (TG/5)' },
          { name: 'vldl', label: 'VLDL Cholesterol', unit: 'mg/dL', normalRange: { max: 30 }, type: 'number', calculated: true, formula: 'triglycerides / 5' },
          { name: 'tc_hdl_ratio', label: 'Total Cholesterol/HDL Ratio', normalRange: { max: 5 }, type: 'number', calculated: true, formula: 'total_cholesterol / hdl' },
          { name: 'ldl_hdl_ratio', label: 'LDL/HDL Ratio', normalRange: { max: 3.5 }, type: 'number', calculated: true, formula: 'ldl / hdl' },
        ],
      },
    ],
  },

  esr: {
    type: 'esr',
    name: 'ESR (Erythrocyte Sedimentation Rate)',
    categories: [
      {
        name: 'ESR',
        fields: [
          { name: 'esr', label: 'ESR (1st Hour)', unit: 'mm/hr', normalRange: { male: { max: 15 }, female: { max: 20 } }, type: 'number' },
        ],
      },
    ],
  },

  bsr: {
    type: 'bsr',
    name: 'Blood Sugar Random (BSR)',
    categories: [
      {
        name: 'Blood Sugar',
        fields: [
          { name: 'bsr', label: 'Blood Sugar Random', unit: 'mg/dL', normalRange: { min: 70, max: 140 }, type: 'number' },
        ],
      },
    ],
  },

  bsf: {
    type: 'bsf',
    name: 'Blood Sugar Fasting (BSF)',
    categories: [
      {
        name: 'Blood Sugar',
        fields: [
          { name: 'bsf', label: 'Blood Sugar Fasting', unit: 'mg/dL', normalRange: { min: 70, max: 100 }, type: 'number' },
        ],
      },
    ],
  },

  serum_calcium: {
    type: 'serum_calcium',
    name: 'Serum Calcium',
    categories: [
      {
        name: 'Calcium',
        fields: [
          { name: 'serum_calcium', label: 'Serum Calcium (Total)', unit: 'mg/dL', normalRange: { min: 8.5, max: 10.5 }, type: 'number' },
          { name: 'ionized_calcium', label: 'Ionized Calcium', unit: 'mg/dL', normalRange: { min: 4.5, max: 5.3 }, type: 'number' },
        ],
      },
    ],
  },

  // NEGATIVE/POSITIVE STATUS TESTS
  mp: {
    type: 'mp',
    name: 'Malaria Parasites (MP)',
    categories: [
      {
        name: 'Malaria Test',
        fields: [
          { name: 'mp_result', label: 'MP (Malaria Parasites)', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'p_vivax', label: 'P. Vivax', type: 'select', options: ['Not Detected', 'Detected'] },
          { name: 'p_falciparum', label: 'P. Falciparum', type: 'select', options: ['Not Detected', 'Detected'] },
        ],
      },
    ],
  },

  typhoid: {
    type: 'typhoid',
    name: 'Typhoid (IgM + IgG)',
    categories: [
      {
        name: 'Typhoid Test',
        fields: [
          { name: 'typhoid_igm', label: 'Typhoid IgM', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'typhoid_igg', label: 'Typhoid IgG', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'widal_typhi_o', label: 'Widal Test - S. Typhi O', type: 'text' },
          { name: 'widal_typhi_h', label: 'Widal Test - S. Typhi H', type: 'text' },
          { name: 'widal_paratyphi_ah', label: 'Widal Test - S. Paratyphi AH', type: 'text' },
          { name: 'widal_paratyphi_bh', label: 'Widal Test - S. Paratyphi BH', type: 'text' },
        ],
      },
    ],
  },

  hcv: {
    type: 'hcv',
    name: 'HCV (Hepatitis C Virus)',
    categories: [
      {
        name: 'HCV Test',
        fields: [
          { name: 'anti_hcv', label: 'Anti-HCV', type: 'select', options: ['Non-Reactive', 'Reactive'] },
        ],
      },
    ],
  },

  hbsag: {
    type: 'hbsag',
    name: 'HBsAg (Hepatitis B Surface Antigen)',
    categories: [
      {
        name: 'HBsAg Test',
        fields: [
          { name: 'hbsag', label: 'HBsAg', type: 'select', options: ['Non-Reactive', 'Reactive'] },
        ],
      },
    ],
  },

  hiv: {
    type: 'hiv',
    name: 'HIV (Human Immunodeficiency Virus)',
    categories: [
      {
        name: 'HIV Test',
        fields: [
          { name: 'hiv', label: 'HIV I & II', type: 'select', options: ['Non-Reactive', 'Reactive'] },
        ],
      },
    ],
  },

  vdrl: {
    type: 'vdrl',
    name: 'VDRL (Venereal Disease Research Laboratory)',
    categories: [
      {
        name: 'VDRL Test',
        fields: [
          { name: 'vdrl', label: 'VDRL', type: 'select', options: ['Non-Reactive', 'Reactive'] },
        ],
      },
    ],
  },

  h_pylori: {
    type: 'h_pylori',
    name: 'Helicobacter Pylori (H. Pylori)',
    categories: [
      {
        name: 'H. Pylori Test',
        fields: [
          { name: 'h_pylori_igg', label: 'H. Pylori IgG', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'h_pylori_antigen', label: 'H. Pylori Antigen', type: 'select', options: ['Negative', 'Positive'] },
        ],
      },
    ],
  },

  // BLOOD GROUP & TYPING
  blood_group: {
    type: 'blood_group',
    name: 'Blood Group',
    categories: [
      {
        name: 'Blood Group',
        fields: [
          { name: 'abo_group', label: 'ABO Blood Group', type: 'select', options: ['A', 'B', 'AB', 'O'] },
          { name: 'rh_factor', label: 'Rh Factor', type: 'select', options: ['Positive', 'Negative'] },
        ],
      },
    ],
  },

  ra_factor: {
    type: 'ra_factor',
    name: 'R.A Factor',
    categories: [
      {
        name: 'R.A Factor',
        fields: [
          { name: 'ra_factor', label: 'Rheumatoid Factor (RA)', unit: 'IU/mL', normalRange: { max: 14 }, type: 'number' },
          { name: 'ra_qualitative', label: 'RA Factor Qualitative', type: 'select', options: ['Negative', 'Positive'] },
        ],
      },
    ],
  },
};

// Active test types to show in template selector (individual tests only)
export const activeReportTypes: ReportType[] = [
  'cbc',
  'lft',
  'rft',
  'lipid_profile',
  'esr',
  'bsr',
  'bsf',
  'serum_calcium',
  'mp',
  'typhoid',
  'hcv',
  'hbsag',
  'hiv',
  'vdrl',
  'h_pylori',
  'blood_group',
  'ra_factor',
];

// Test type labels for display
export const reportTypeLabels: Record<ReportType, string> = {
  blood_test: 'Blood Test',
  urine_analysis: 'Urine Analysis',
  screening_tests: 'Screening Tests',
  blood_group_typing: 'Blood Group Typing',
  cbc: 'CBC',
  lft: 'LFT',
  rft: 'RFT',
  lipid_profile: 'Lipid Profile',
  esr: 'ESR',
  bsr: 'BSR',
  bsf: 'BSF',
  serum_calcium: 'Serum Calcium',
  mp: 'MP',
  typhoid: 'Typhoid',
  hcv: 'HCV',
  hbsag: 'HBsAg',
  hiv: 'HIV',
  vdrl: 'VDRL',
  h_pylori: 'H. Pylori',
  blood_group: 'Blood Group',
  ra_factor: 'R.A Factor',
};

export const getReportTemplate = (type: ReportType): ReportTemplate => {
  return reportTemplates[type];
};

export const getReportTypeName = (type: ReportType): string => {
  return reportTemplates[type]?.name || type;
};
