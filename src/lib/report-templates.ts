import { ReportTemplate, ReportType } from '@/types/database';

export const reportTemplates: Record<ReportType, ReportTemplate> = {
  blood_test: {
    type: 'blood_test',
    name: 'Blood Test',
    categories: [
      {
        name: 'Complete Blood Count (CBC)',
        fields: [
          { name: 'hemoglobin', label: 'Hemoglobin', unit: 'g/dL', normalRange: { male: { min: 13.5, max: 17.5 }, female: { min: 12.0, max: 16.0 } }, type: 'number' },
          { name: 'rbc', label: 'RBC Count', unit: 'million/μL', normalRange: { male: { min: 4.5, max: 5.5 }, female: { min: 4.0, max: 5.0 } }, type: 'number' },
          { name: 'wbc', label: 'WBC Count', unit: 'cells/μL', normalRange: { min: 4500, max: 11000 }, type: 'number' },
          { name: 'platelets', label: 'Platelet Count', unit: 'cells/μL', normalRange: { min: 150000, max: 400000 }, type: 'number' },
          { name: 'hematocrit', label: 'Hematocrit', unit: '%', normalRange: { male: { min: 38.3, max: 48.6 }, female: { min: 35.5, max: 44.9 } }, type: 'number' },
          { name: 'mcv', label: 'MCV', unit: 'fL', normalRange: { min: 80, max: 100 }, type: 'number' },
          { name: 'mch', label: 'MCH', unit: 'pg', normalRange: { min: 27, max: 33 }, type: 'number' },
          { name: 'mchc', label: 'MCHC', unit: 'g/dL', normalRange: { min: 32, max: 36 }, type: 'number' },
        ],
      },
      {
        name: 'Differential Count',
        fields: [
          { name: 'neutrophils', label: 'Neutrophils', unit: '%', normalRange: { min: 40, max: 70 }, type: 'number' },
          { name: 'lymphocytes', label: 'Lymphocytes', unit: '%', normalRange: { min: 20, max: 40 }, type: 'number' },
          { name: 'monocytes', label: 'Monocytes', unit: '%', normalRange: { min: 2, max: 8 }, type: 'number' },
          { name: 'eosinophils', label: 'Eosinophils', unit: '%', normalRange: { min: 1, max: 4 }, type: 'number' },
          { name: 'basophils', label: 'Basophils', unit: '%', normalRange: { min: 0, max: 1 }, type: 'number' },
        ],
      },
      {
        name: 'Lipid Profile',
        fields: [
          { name: 'total_cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', normalRange: { max: 200 }, type: 'number' },
          { name: 'hdl', label: 'HDL Cholesterol', unit: 'mg/dL', normalRange: { min: 40 }, type: 'number' },
          { name: 'ldl', label: 'LDL Cholesterol', unit: 'mg/dL', normalRange: { max: 100 }, type: 'number' },
          { name: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', normalRange: { max: 150 }, type: 'number' },
          { name: 'vldl', label: 'VLDL', unit: 'mg/dL', normalRange: { min: 5, max: 40 }, type: 'number', calculated: true, formula: 'triglycerides / 5' },
        ],
      },
      {
        name: 'Liver Function Tests',
        fields: [
          { name: 'sgpt_alt', label: 'SGPT (ALT)', unit: 'U/L', normalRange: { min: 7, max: 56 }, type: 'number' },
          { name: 'sgot_ast', label: 'SGOT (AST)', unit: 'U/L', normalRange: { min: 10, max: 40 }, type: 'number' },
          { name: 'alp', label: 'Alkaline Phosphatase', unit: 'U/L', normalRange: { min: 44, max: 147 }, type: 'number' },
          { name: 'total_bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', normalRange: { min: 0.1, max: 1.2 }, type: 'number' },
          { name: 'direct_bilirubin', label: 'Direct Bilirubin', unit: 'mg/dL', normalRange: { min: 0, max: 0.3 }, type: 'number' },
          { name: 'indirect_bilirubin', label: 'Indirect Bilirubin', unit: 'mg/dL', normalRange: { min: 0.1, max: 1.0 }, type: 'number', calculated: true },
          { name: 'total_protein', label: 'Total Protein', unit: 'g/dL', normalRange: { min: 6.0, max: 8.3 }, type: 'number' },
          { name: 'albumin', label: 'Albumin', unit: 'g/dL', normalRange: { min: 3.5, max: 5.5 }, type: 'number' },
          { name: 'globulin', label: 'Globulin', unit: 'g/dL', normalRange: { min: 2.0, max: 3.5 }, type: 'number', calculated: true },
        ],
      },
      {
        name: 'Kidney Function Tests',
        fields: [
          { name: 'urea', label: 'Blood Urea', unit: 'mg/dL', normalRange: { min: 7, max: 20 }, type: 'number' },
          { name: 'creatinine', label: 'Creatinine', unit: 'mg/dL', normalRange: { male: { min: 0.7, max: 1.3 }, female: { min: 0.6, max: 1.1 } }, type: 'number' },
          { name: 'uric_acid', label: 'Uric Acid', unit: 'mg/dL', normalRange: { male: { min: 3.4, max: 7.0 }, female: { min: 2.4, max: 6.0 } }, type: 'number' },
          { name: 'bun', label: 'BUN', unit: 'mg/dL', normalRange: { min: 6, max: 24 }, type: 'number' },
        ],
      },
      {
        name: 'Blood Sugar',
        fields: [
          { name: 'fasting_glucose', label: 'Fasting Blood Sugar', unit: 'mg/dL', normalRange: { min: 70, max: 100 }, type: 'number' },
          { name: 'pp_glucose', label: 'Post Prandial Blood Sugar', unit: 'mg/dL', normalRange: { max: 140 }, type: 'number' },
          { name: 'random_glucose', label: 'Random Blood Sugar', unit: 'mg/dL', normalRange: { max: 200 }, type: 'number' },
          { name: 'hba1c', label: 'HbA1c', unit: '%', normalRange: { max: 5.7 }, type: 'number' },
        ],
      },
    ],
  },
  urine_analysis: {
    type: 'urine_analysis',
    name: 'Urine Analysis',
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
  hormone_immunology: {
    type: 'hormone_immunology',
    name: 'Hormone & Immunology Tests',
    categories: [
      {
        name: 'Thyroid Profile',
        fields: [
          { name: 't3', label: 'T3 (Triiodothyronine)', unit: 'ng/dL', normalRange: { min: 80, max: 200 }, type: 'number' },
          { name: 't4', label: 'T4 (Thyroxine)', unit: 'μg/dL', normalRange: { min: 5.0, max: 12.0 }, type: 'number' },
          { name: 'tsh', label: 'TSH', unit: 'mIU/L', normalRange: { min: 0.4, max: 4.0 }, type: 'number' },
          { name: 'ft3', label: 'Free T3', unit: 'pg/mL', normalRange: { min: 2.3, max: 4.2 }, type: 'number' },
          { name: 'ft4', label: 'Free T4', unit: 'ng/dL', normalRange: { min: 0.8, max: 1.8 }, type: 'number' },
        ],
      },
      {
        name: 'Reproductive Hormones',
        fields: [
          { name: 'fsh', label: 'FSH', unit: 'mIU/mL', type: 'number' },
          { name: 'lh', label: 'LH', unit: 'mIU/mL', type: 'number' },
          { name: 'prolactin', label: 'Prolactin', unit: 'ng/mL', normalRange: { male: { max: 15 }, female: { max: 25 } }, type: 'number' },
          { name: 'estradiol', label: 'Estradiol', unit: 'pg/mL', type: 'number' },
          { name: 'progesterone', label: 'Progesterone', unit: 'ng/mL', type: 'number' },
          { name: 'testosterone', label: 'Testosterone', unit: 'ng/dL', normalRange: { male: { min: 270, max: 1070 }, female: { min: 15, max: 70 } }, type: 'number' },
        ],
      },
      {
        name: 'Diabetes Markers',
        fields: [
          { name: 'insulin_fasting', label: 'Fasting Insulin', unit: 'μU/mL', normalRange: { min: 2, max: 25 }, type: 'number' },
          { name: 'c_peptide', label: 'C-Peptide', unit: 'ng/mL', normalRange: { min: 0.5, max: 2.0 }, type: 'number' },
          { name: 'homa_ir', label: 'HOMA-IR', normalRange: { max: 2.5 }, type: 'number', calculated: true },
        ],
      },
      {
        name: 'Other Hormones',
        fields: [
          { name: 'cortisol', label: 'Cortisol (Morning)', unit: 'μg/dL', normalRange: { min: 6, max: 23 }, type: 'number' },
          { name: 'dhea_s', label: 'DHEA-S', unit: 'μg/dL', type: 'number' },
          { name: 'growth_hormone', label: 'Growth Hormone', unit: 'ng/mL', type: 'number' },
          { name: 'igf1', label: 'IGF-1', unit: 'ng/mL', type: 'number' },
          { name: 'pth', label: 'Parathyroid Hormone', unit: 'pg/mL', normalRange: { min: 15, max: 65 }, type: 'number' },
        ],
      },
      {
        name: 'Immunology',
        fields: [
          { name: 'crp', label: 'C-Reactive Protein', unit: 'mg/L', normalRange: { max: 3.0 }, type: 'number' },
          { name: 'esr', label: 'ESR', unit: 'mm/hr', normalRange: { male: { max: 15 }, female: { max: 20 } }, type: 'number' },
          { name: 'ana', label: 'ANA', type: 'select', options: ['Negative', 'Positive'] },
          { name: 'rf', label: 'Rheumatoid Factor', unit: 'IU/mL', normalRange: { max: 14 }, type: 'number' },
          { name: 'anti_ccp', label: 'Anti-CCP', unit: 'U/mL', normalRange: { max: 20 }, type: 'number' },
        ],
      },
    ],
  },
  microbiology: {
    type: 'microbiology',
    name: 'Microbiology Tests',
    categories: [
      {
        name: 'Specimen Information',
        fields: [
          { name: 'specimen_type', label: 'Specimen Type', type: 'select', options: ['Blood', 'Urine', 'Stool', 'Sputum', 'Wound Swab', 'Throat Swab', 'CSF', 'Other'] },
          { name: 'collection_date', label: 'Collection Date/Time', type: 'text' },
          { name: 'specimen_condition', label: 'Specimen Condition', type: 'select', options: ['Satisfactory', 'Unsatisfactory'] },
        ],
      },
      {
        name: 'Gram Stain',
        fields: [
          { name: 'gram_stain_result', label: 'Gram Stain Result', type: 'textarea' },
          { name: 'wbc_seen', label: 'WBC Seen', type: 'select', options: ['None', 'Few', 'Moderate', 'Many'] },
          { name: 'bacteria_seen', label: 'Bacteria Seen', type: 'textarea' },
        ],
      },
      {
        name: 'Culture Results',
        fields: [
          { name: 'culture_result', label: 'Culture Result', type: 'select', options: ['No Growth', 'Growth', 'Mixed Flora'] },
          { name: 'organism_1', label: 'Organism 1', type: 'text' },
          { name: 'organism_1_count', label: 'Colony Count', type: 'select', options: ['Light', 'Moderate', 'Heavy', 'CFU/mL'] },
          { name: 'organism_2', label: 'Organism 2', type: 'text' },
          { name: 'organism_2_count', label: 'Colony Count', type: 'select', options: ['Light', 'Moderate', 'Heavy', 'CFU/mL'] },
        ],
      },
      {
        name: 'Antibiotic Sensitivity',
        fields: [
          { name: 'sensitivity_notes', label: 'Sensitivity Pattern', type: 'textarea' },
          { name: 'amoxicillin', label: 'Amoxicillin', type: 'select', options: ['Sensitive', 'Intermediate', 'Resistant', 'Not Tested'] },
          { name: 'ciprofloxacin', label: 'Ciprofloxacin', type: 'select', options: ['Sensitive', 'Intermediate', 'Resistant', 'Not Tested'] },
          { name: 'azithromycin', label: 'Azithromycin', type: 'select', options: ['Sensitive', 'Intermediate', 'Resistant', 'Not Tested'] },
          { name: 'ceftriaxone', label: 'Ceftriaxone', type: 'select', options: ['Sensitive', 'Intermediate', 'Resistant', 'Not Tested'] },
          { name: 'vancomycin', label: 'Vancomycin', type: 'select', options: ['Sensitive', 'Intermediate', 'Resistant', 'Not Tested'] },
          { name: 'gentamicin', label: 'Gentamicin', type: 'select', options: ['Sensitive', 'Intermediate', 'Resistant', 'Not Tested'] },
        ],
      },
      {
        name: 'Additional Notes',
        fields: [
          { name: 'interpretation', label: 'Interpretation', type: 'textarea' },
          { name: 'recommendations', label: 'Recommendations', type: 'textarea' },
        ],
      },
    ],
  },
  ultrasound: {
    type: 'ultrasound',
    name: 'Ultrasound Report',
    categories: [
      {
        name: 'Study Information',
        fields: [
          { name: 'exam_type', label: 'Examination Type', type: 'select', options: ['Abdomen', 'Pelvis', 'Obstetric', 'Thyroid', 'Breast', 'Scrotum', 'Renal', 'Other'] },
          { name: 'indication', label: 'Clinical Indication', type: 'textarea' },
          { name: 'equipment', label: 'Equipment Used', type: 'text' },
        ],
      },
      {
        name: 'Liver',
        fields: [
          { name: 'liver_size', label: 'Size', type: 'select', options: ['Normal', 'Enlarged', 'Small'] },
          { name: 'liver_echo', label: 'Echogenicity', type: 'select', options: ['Normal', 'Increased', 'Decreased', 'Heterogeneous'] },
          { name: 'liver_surface', label: 'Surface', type: 'select', options: ['Smooth', 'Irregular', 'Nodular'] },
          { name: 'liver_findings', label: 'Findings', type: 'textarea' },
        ],
      },
      {
        name: 'Gallbladder & Biliary',
        fields: [
          { name: 'gb_status', label: 'Gallbladder', type: 'select', options: ['Normal', 'Distended', 'Contracted', 'Absent (Post-cholecystectomy)'] },
          { name: 'gb_wall', label: 'Wall Thickness', type: 'select', options: ['Normal (<3mm)', 'Thickened'] },
          { name: 'gb_stones', label: 'Stones', type: 'select', options: ['None', 'Single', 'Multiple', 'Sludge'] },
          { name: 'cbd', label: 'CBD', type: 'text' },
        ],
      },
      {
        name: 'Kidneys',
        fields: [
          { name: 'right_kidney_size', label: 'Right Kidney Size', unit: 'cm', type: 'text' },
          { name: 'right_kidney_findings', label: 'Right Kidney Findings', type: 'textarea' },
          { name: 'left_kidney_size', label: 'Left Kidney Size', unit: 'cm', type: 'text' },
          { name: 'left_kidney_findings', label: 'Left Kidney Findings', type: 'textarea' },
        ],
      },
      {
        name: 'Spleen & Pancreas',
        fields: [
          { name: 'spleen_size', label: 'Spleen Size', type: 'select', options: ['Normal', 'Enlarged'] },
          { name: 'spleen_findings', label: 'Spleen Findings', type: 'textarea' },
          { name: 'pancreas', label: 'Pancreas', type: 'textarea' },
        ],
      },
      {
        name: 'Other Findings',
        fields: [
          { name: 'ascites', label: 'Ascites', type: 'select', options: ['None', 'Minimal', 'Moderate', 'Severe'] },
          { name: 'lymph_nodes', label: 'Lymph Nodes', type: 'textarea' },
          { name: 'other_findings', label: 'Other Findings', type: 'textarea' },
        ],
      },
      {
        name: 'Impression & Recommendations',
        fields: [
          { name: 'impression', label: 'Impression', type: 'textarea' },
          { name: 'recommendations', label: 'Recommendations', type: 'textarea' },
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
