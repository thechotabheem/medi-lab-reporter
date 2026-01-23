import { ReportTemplate, ReportType } from '@/types/database';

export const reportTemplates: Record<ReportType, ReportTemplate> = {
  blood_test: {
    type: 'blood_test',
    name: 'Value Based Tests',
    categories: [
      {
        name: 'Complete Blood Count (CBC)',
        fields: [
          { name: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', normalRange: { male: { min: 13.5, max: 17.5 }, female: { min: 12.0, max: 16.0 } }, type: 'number' },
          { name: 'rbc', label: 'RBC Count', unit: 'million/μL', normalRange: { male: { min: 4.5, max: 5.5 }, female: { min: 4.0, max: 5.0 } }, type: 'number' },
          { name: 'wbc', label: 'WBC Count', unit: 'cells/μL', normalRange: { min: 4500, max: 11000 }, type: 'number' },
          { name: 'platelets', label: 'Platelet Count', unit: 'cells/μL', normalRange: { min: 150000, max: 400000 }, type: 'number' },
          { name: 'hematocrit', label: 'Hematocrit (PCV)', unit: '%', normalRange: { male: { min: 38.3, max: 48.6 }, female: { min: 35.5, max: 44.9 } }, type: 'number' },
          { name: 'mcv', label: 'MCV', unit: 'fL', normalRange: { min: 80, max: 100 }, type: 'number' },
          { name: 'mch', label: 'MCH', unit: 'pg', normalRange: { min: 27, max: 33 }, type: 'number' },
          { name: 'mchc', label: 'MCHC', unit: 'g/dL', normalRange: { min: 32, max: 36 }, type: 'number' },
          { name: 'neutrophils', label: 'Neutrophils', unit: '%', normalRange: { min: 40, max: 70 }, type: 'number' },
          { name: 'lymphocytes', label: 'Lymphocytes', unit: '%', normalRange: { min: 20, max: 40 }, type: 'number' },
          { name: 'monocytes', label: 'Monocytes', unit: '%', normalRange: { min: 2, max: 8 }, type: 'number' },
          { name: 'eosinophils', label: 'Eosinophils', unit: '%', normalRange: { min: 1, max: 4 }, type: 'number' },
          { name: 'basophils', label: 'Basophils', unit: '%', normalRange: { min: 0, max: 1 }, type: 'number' },
        ],
      },
      {
        name: 'Liver Function Test (LFT)',
        fields: [
          { name: 'sgpt_alt', label: 'SGPT (ALT)', unit: 'U/L', normalRange: { min: 7, max: 56 }, type: 'number' },
          { name: 'sgot_ast', label: 'SGOT (AST)', unit: 'U/L', normalRange: { min: 10, max: 40 }, type: 'number' },
          { name: 'alp', label: 'Alkaline Phosphatase', unit: 'U/L', normalRange: { min: 44, max: 147 }, type: 'number' },
          { name: 'total_bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', normalRange: { min: 0.1, max: 1.2 }, type: 'number' },
          { name: 'direct_bilirubin', label: 'Direct Bilirubin', unit: 'mg/dL', normalRange: { min: 0, max: 0.3 }, type: 'number' },
          { name: 'indirect_bilirubin', label: 'Indirect Bilirubin', unit: 'mg/dL', normalRange: { min: 0.1, max: 1.0 }, type: 'number' },
          { name: 'total_protein', label: 'Total Protein', unit: 'g/dL', normalRange: { min: 6.0, max: 8.3 }, type: 'number' },
          { name: 'albumin', label: 'Albumin', unit: 'g/dL', normalRange: { min: 3.5, max: 5.5 }, type: 'number' },
          { name: 'globulin', label: 'Globulin', unit: 'g/dL', normalRange: { min: 2.0, max: 3.5 }, type: 'number' },
          { name: 'ag_ratio', label: 'A/G Ratio', normalRange: { min: 1.0, max: 2.5 }, type: 'number' },
        ],
      },
      {
        name: 'Renal Function Test (RFT)',
        fields: [
          { name: 'urea', label: 'Blood Urea', unit: 'mg/dL', normalRange: { min: 7, max: 20 }, type: 'number' },
          { name: 'creatinine', label: 'Serum Creatinine', unit: 'mg/dL', normalRange: { male: { min: 0.7, max: 1.3 }, female: { min: 0.6, max: 1.1 } }, type: 'number' },
          { name: 'uric_acid', label: 'Uric Acid', unit: 'mg/dL', normalRange: { male: { min: 3.4, max: 7.0 }, female: { min: 2.4, max: 6.0 } }, type: 'number' },
          { name: 'bun', label: 'BUN', unit: 'mg/dL', normalRange: { min: 6, max: 24 }, type: 'number' },
          { name: 'sodium', label: 'Sodium (Na)', unit: 'mEq/L', normalRange: { min: 136, max: 145 }, type: 'number' },
          { name: 'potassium', label: 'Potassium (K)', unit: 'mEq/L', normalRange: { min: 3.5, max: 5.0 }, type: 'number' },
          { name: 'chloride', label: 'Chloride (Cl)', unit: 'mEq/L', normalRange: { min: 98, max: 106 }, type: 'number' },
        ],
      },
      {
        name: 'Lipid Profile (LP)',
        fields: [
          { name: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', normalRange: { max: 200 }, type: 'number' },
          { name: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', normalRange: { min: 40 }, type: 'number' },
          { name: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', normalRange: { max: 100 }, type: 'number' },
          { name: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', normalRange: { max: 150 }, type: 'number' },
          { name: 'vldl', label: 'VLDL', unit: 'mg/dL', normalRange: { min: 5, max: 40 }, type: 'number', calculated: true, formula: 'triglycerides / 5' },
          { name: 'tc_hdl_ratio', label: 'TC/HDL Ratio', normalRange: { max: 5.0 }, type: 'number' },
        ],
      },
      {
        name: 'ESR (Erythrocyte Sedimentation Rate)',
        fields: [
          { name: 'esr', label: 'ESR', unit: 'mm/hr', normalRange: { male: { max: 15 }, female: { max: 20 } }, type: 'number' },
        ],
      },
      {
        name: 'Blood Sugar Tests',
        fields: [
          { name: 'bsr', label: 'Blood Sugar Random (BSR)', unit: 'mg/dL', normalRange: { max: 200 }, type: 'number' },
          { name: 'bsf', label: 'Blood Sugar Fasting (BSF)', unit: 'mg/dL', normalRange: { min: 70, max: 100 }, type: 'number' },
          { name: 'ppbs', label: 'Post Prandial Blood Sugar', unit: 'mg/dL', normalRange: { max: 140 }, type: 'number' },
          { name: 'hba1c', label: 'HbA1c', unit: '%', normalRange: { max: 5.7 }, type: 'number' },
        ],
      },
      {
        name: 'Serum Calcium (S.Ca)',
        fields: [
          { name: 'serum_calcium', label: 'Serum Calcium', unit: 'mg/dL', normalRange: { min: 8.5, max: 10.5 }, type: 'number' },
          { name: 'ionized_calcium', label: 'Ionized Calcium', unit: 'mg/dL', normalRange: { min: 4.5, max: 5.6 }, type: 'number' },
        ],
      },
    ],
  },
  urine_analysis: {
    type: 'urine_analysis',
    name: 'Urine Analysis (U.A)',
    categories: [
      {
        name: 'Physical Examination',
        fields: [
          { name: 'color', label: 'Color', type: 'select', options: ['Pale Yellow', 'Yellow', 'Dark Yellow', 'Amber', 'Red', 'Brown', 'Colorless'] },
          { name: 'appearance', label: 'Appearance', type: 'select', options: ['Clear', 'Slightly Hazy', 'Hazy', 'Cloudy', 'Turbid'] },
          { name: 'specific_gravity', label: 'Specific Gravity', normalRange: { min: 1.005, max: 1.030 }, type: 'number' },
          { name: 'volume', label: 'Volume', unit: 'mL', type: 'number' },
        ],
      },
      {
        name: 'Chemical Examination',
        fields: [
          { name: 'ph', label: 'pH', normalRange: { min: 4.5, max: 8.0 }, type: 'number' },
          { name: 'protein', label: 'Protein', type: 'select', options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'] },
          { name: 'glucose', label: 'Glucose', type: 'select', options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'] },
          { name: 'ketones', label: 'Ketones', type: 'select', options: ['Negative', 'Trace', 'Small', 'Moderate', 'Large'] },
          { name: 'blood', label: 'Blood', type: 'select', options: ['Negative', 'Trace', '1+', '2+', '3+'] },
          { name: 'bilirubin', label: 'Bilirubin', type: 'select', options: ['Negative', '1+', '2+', '3+'] },
          { name: 'urobilinogen', label: 'Urobilinogen', unit: 'EU/dL', normalRange: { min: 0.1, max: 1.0 }, type: 'number' },
          { name: 'nitrite', label: 'Nitrite', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'leukocyte_esterase', label: 'Leukocyte Esterase', type: 'select', options: ['Negative', 'Trace', '1+', '2+', '3+'] },
        ],
      },
      {
        name: 'Microscopic Examination',
        fields: [
          { name: 'rbc_hpf', label: 'RBC', unit: '/HPF', normalRange: { max: 5 }, type: 'number' },
          { name: 'wbc_hpf', label: 'WBC', unit: '/HPF', normalRange: { max: 5 }, type: 'number' },
          { name: 'epithelial_cells', label: 'Epithelial Cells', type: 'select', options: ['Few', 'Moderate', 'Many'] },
          { name: 'casts', label: 'Casts', type: 'text' },
          { name: 'crystals', label: 'Crystals', type: 'text' },
          { name: 'bacteria', label: 'Bacteria', type: 'select', options: ['None', 'Few', 'Moderate', 'Many'] },
          { name: 'yeast', label: 'Yeast', type: 'select', options: ['None', 'Few', 'Moderate', 'Many'] },
        ],
      },
    ],
  },
  screening_tests: {
    type: 'screening_tests',
    name: 'Screening Tests (Negative/Positive)',
    categories: [
      {
        name: 'Malaria Parasites (MP)',
        fields: [
          { name: 'mp_result', label: 'MP Result', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'mp_species', label: 'Species (if positive)', type: 'select', options: ['Not Applicable', 'P. Vivax', 'P. Falciparum', 'P. Malariae', 'P. Ovale', 'Mixed'] },
          { name: 'mp_density', label: 'Parasite Density', type: 'select', options: ['Not Applicable', '+', '++', '+++', '++++'] },
        ],
      },
      {
        name: 'Typhoid (Widal Test)',
        fields: [
          { name: 'typhoid_igm', label: 'Typhoid IgM', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'typhoid_igg', label: 'Typhoid IgG', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'salmonella_o', label: 'Salmonella O', type: 'text' },
          { name: 'salmonella_h', label: 'Salmonella H', type: 'text' },
        ],
      },
      {
        name: 'Hepatitis C Virus (HCV)',
        fields: [
          { name: 'hcv_result', label: 'HCV Antibody', type: 'select', options: ['Negative', 'Positive', 'Borderline'] },
          { name: 'hcv_method', label: 'Method', type: 'select', options: ['ICT', 'ELISA', 'CLIA'] },
        ],
      },
      {
        name: 'Hepatitis B Surface Antigen (HBsAg)',
        fields: [
          { name: 'hbsag_result', label: 'HBsAg', type: 'select', options: ['Negative', 'Positive', 'Borderline'] },
          { name: 'hbsag_method', label: 'Method', type: 'select', options: ['ICT', 'ELISA', 'CLIA'] },
        ],
      },
      {
        name: 'HIV (Human Immunodeficiency Virus)',
        fields: [
          { name: 'hiv_result', label: 'HIV 1 & 2', type: 'select', options: ['Non-Reactive', 'Reactive', 'Indeterminate'] },
          { name: 'hiv_method', label: 'Method', type: 'select', options: ['ICT', 'ELISA', 'CLIA'] },
        ],
      },
      {
        name: 'VDRL (Syphilis)',
        fields: [
          { name: 'vdrl_result', label: 'VDRL', type: 'select', options: ['Non-Reactive', 'Reactive', 'Weakly Reactive'] },
          { name: 'vdrl_titer', label: 'Titer (if reactive)', type: 'text' },
        ],
      },
      {
        name: 'Helicobacter Pylori (H. Pylori)',
        fields: [
          { name: 'hpylori_result', label: 'H. Pylori', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'hpylori_method', label: 'Method', type: 'select', options: ['Stool Antigen', 'Serum Antibody', 'Urea Breath Test'] },
        ],
      },
    ],
  },
  blood_group_typing: {
    type: 'blood_group_typing',
    name: 'Blood Group & Typing',
    categories: [
      {
        name: 'Blood Group',
        fields: [
          { name: 'abo_group', label: 'ABO Blood Group', type: 'select', options: ['A', 'B', 'AB', 'O'] },
          { name: 'rh_factor', label: 'Rh Factor', type: 'select', options: ['Positive (+)', 'Negative (-)'] },
          { name: 'blood_group_complete', label: 'Complete Blood Group', type: 'text' },
        ],
      },
      {
        name: 'Rheumatoid Factor (R.A Factor)',
        fields: [
          { name: 'ra_result', label: 'R.A Factor', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'ra_titer', label: 'Titer (if positive)', unit: 'IU/mL', type: 'number' },
          { name: 'ra_method', label: 'Method', type: 'select', options: ['Latex Agglutination', 'ELISA', 'Nephelometry'] },
        ],
      },
    ],
  },
};

export const getReportTemplate = (type: ReportType): ReportTemplate => {
  return reportTemplates[type];
};

export const getReportTypeName = (type: ReportType): string => {
  return reportTemplates[type]?.name || type;
};
